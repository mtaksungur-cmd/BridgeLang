// pages/api/booking/reject.js
import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';
import { logTransaction } from '../../../lib/transactionLogger';
import axios from 'axios';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { bookingId, reason } = req.body;
    if (!bookingId) {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    try {
        const ref = adminDb.collection('bookings').doc(bookingId);
        const snap = await ref.get();

        if (!snap.exists) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const data = snap.data();

        // 1. ✅ Delete Daily.co room if exists
        if (data.meetingLink) {
            try {
                const roomName = data.meetingLink.split('/').pop();
                await axios.delete(`https://api.daily.co/v1/rooms/${roomName}`, {
                    headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` }
                });
                console.log(`✅ Daily.co room deleted: ${roomName}`);
            } catch (err) {
                console.warn('⚠️ Daily.co room deletion failed:', err.message);
                // Continue even if room deletion fails
            }
        }

        // 2. ✅ Stripe refund
        let refundId = null;
        if (data.paymentIntentId || data.sessionId) {
            try {
                // Get payment intent from session if needed
                let paymentIntentId = data.paymentIntentId;

                if (!paymentIntentId && data.sessionId) {
                    const session = await stripe.checkout.sessions.retrieve(data.sessionId);
                    paymentIntentId = session.payment_intent;
                }

                if (paymentIntentId) {
                    const refund = await stripe.refunds.create({
                        payment_intent: paymentIntentId,
                        reason: 'requested_by_customer',
                        metadata: {
                            bookingId: bookingId,
                            rejectionReason: reason || 'Teacher rejected booking'
                        }
                    });
                    refundId = refund.id;
                    console.log(`✅ Stripe refund created: ${refundId}`);
                }
            } catch (err) {
                console.error('❌ Stripe refund failed:', err.message);
                return res.status(500).json({ error: 'Refund failed: ' + err.message });
            }
        }

        // 3. ✅ Update booking status
        await ref.update({
            status: 'rejected',
            meetingLink: null,
            rejectedAt: new Date().toISOString(),
            rejectionReason: reason || 'Teacher unavailable',
            refundId: refundId
        });

        // 4. ✅ Send emails
        try {
            const teacherRef = adminDb.collection('users').doc(data.teacherId);
            const studentRef = adminDb.collection('users').doc(data.studentId);
            const [teacherSnap, studentSnap] = await Promise.all([
                teacherRef.get(),
                studentRef.get(),
            ]);

            const teacher = teacherSnap.data() || {};
            const student = studentSnap.data() || {};

            // Email to student
            await sendMail({
                to: student.email,
                subject: '❌ Lesson Booking Rejected',
                html: `
          <p>Hi ${student.name || 'Student'},</p>
          <p>Unfortunately, your lesson booking with <b>${teacher.name || 'teacher'}</b> has been rejected.</p>
          <p><b>Date:</b> ${data.date}</p>
          <p><b>Time:</b> ${data.startTime} - ${data.endTime}</p>
          ${reason ? `<p><b>Reason:</b> ${reason}</p>` : ''}
          <p><b>Refund:</b> A full refund of £${(data.amountPaid / 100).toFixed(2)} has been processed to your original payment method. It may take 5-10 business days to appear.</p>
          <p>You can browse other available teachers to find a new lesson.</p>
          <p>BridgeLang Team</p>
        `,
            });

            // Email to teacher (confirmation)
            await sendMail({
                to: teacher.email,
                subject: '✓ Booking Rejection Confirmed',
                html: `
          <p>Hi ${teacher.name || 'Teacher'},</p>
          <p>You have successfully rejected the booking with <b>${student.name || 'Student'}</b>.</p>
          <p><b>Date:</b> ${data.date}</p>
          <p><b>Time:</b> ${data.startTime} - ${data.endTime}</p>
          <p>The student has been refunded and your schedule is now free for this time slot.</p>
          <p>BridgeLang Teacher Portal</p>
        `,
            });
        } catch (err) {
            console.warn('⚠️ Rejection email failed:', err.message);
        }

        return res.status(200).json({
            success: true,
            refundId: refundId,
            message: 'Booking rejected and refund processed'
        });

    } catch (error) {
        console.error('Reject booking error:', error);
        return res.status(500).json({ error: error.message });
    }
}
