import { adminDb } from '../../../lib/firebaseAdmin';
import { logTransaction } from '../../../lib/transactionLogger';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { bookingId } = req.body;

    if (!bookingId) {
        return res.status(400).json({ error: 'Missing bookingId' });
    }

    try {
        // Get booking
        const ref = adminDb.collection('bookings').doc(bookingId);
        const snap = await ref.get();

        if (!snap.exists) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const data = snap.data();

        // Validate: lesson must be completed
        if (data.status !== 'completed') {
            return res.status(400).json({
                error: 'Cannot transfer: lesson not completed'
            });
        }

        if (data.transferStatus === 'completed') {
            return res.status(400).json({
                error: 'Payment already transferred to teacher'
            });
        }

        // Get teacher
        const teacherRef = adminDb.collection('users').doc(data.teacherId);
        const teacherSnap = await teacherRef.get();

        if (!teacherSnap.exists) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        const teacherData = teacherSnap.data();

        if (!teacherData.stripeAccountId) {
            console.error('Teacher has no Stripe account:', data.teacherId);
            return res.status(400).json({
                error: 'Teacher payment account not configured'
            });
        }

        // Calculate amounts
        const platformFeePercent = 15; // 15% platform fee
        const teacherPercent = 100 - platformFeePercent;

        const amountPaid = data.amountPaid || 0;
        const teacherAmount = (amountPaid * teacherPercent) / 100;
        const platformFee = (amountPaid * platformFeePercent) / 100;

        console.log(`💰 Transferring payment for booking ${bookingId}`);
        console.log(`  Total paid: £${amountPaid.toFixed(2)}`);
        console.log(`  Teacher (${teacherPercent}%): £${teacherAmount.toFixed(2)}`);
        console.log(`  Platform (${platformFeePercent}%): £${platformFee.toFixed(2)}`);

        // Create Stripe transfer
        const transfer = await stripe.transfers.create({
            amount: Math.floor(teacherAmount * 100), // Convert to cents
            currency: 'gbp',
            destination: teacherData.stripeAccountId,
            transfer_group: bookingId,
            metadata: {
                bookingId: bookingId,
                teacherId: data.teacherId,
                studentId: data.studentId,
                date: data.date,
                startTime: data.startTime
            }
        });

        console.log('✅ Transfer created:', transfer.id);

        // Update booking
        await ref.update({
            transferStatus: 'completed',
            transferId: transfer.id,
            transferredAt: new Date().toISOString(),
            teacherAmount: teacherAmount,
            platformFee: platformFee
        });

        // Log transaction
        await logTransaction({
            type: 'payout',
            bookingId: bookingId,
            userId: data.teacherId,
            amount: teacherAmount,
            currency: 'GBP',
            stripeId: transfer.id,
            status: 'success',
            metadata: {
                platformFee: platformFee,
                originalAmount: amountPaid
            }
        });

        console.log('✅ Payment transferred successfully');

        return res.status(200).json({
            success: true,
            transfer: {
                id: transfer.id,
                teacherAmount: teacherAmount,
                platformFee: platformFee
            }
        });

    } catch (error) {
        console.error('❌ Transfer error:', error);

        // Log failed transaction
        try {
            await logTransaction({
                type: 'payout',
                bookingId: bookingId,
                userId: data?.teacherId || 'unknown',
                amount: 0,
                currency: 'GBP',
                stripeId: null,
                status: 'failed',
                metadata: {
                    error: error.message
                }
            });
        } catch (logError) {
            console.error('Failed to log error:', logError);
        }

        return res.status(500).json({
            error: 'Transfer failed: ' + error.message
        });
    }
}
