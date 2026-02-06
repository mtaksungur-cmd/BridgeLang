// pages/api/booking/cancel.js
/**
 * Handle lesson cancellation with refund policy
 * 
 * Cancellation Policy:
 * - >24h before: 100% refund
 * - 12-24h before: 50% refund  
 * - <12h before: No refund
 * - Teacher cancel: Always 100% refund
 */

import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';
import axios from 'axios';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { bookingId, cancelledBy, reason } = req.body;
    // cancelledBy: 'student' or 'teacher'

    if (!bookingId || !cancelledBy) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const ref = adminDb.collection('bookings').doc(bookingId);
        const snap = await ref.get();

        if (!snap.exists) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const data = snap.data();

        // Calculate time until lesson
        const lessonDateTime = new Date(`${data.date}T${data.startTime}:00`);
        const now = new Date();
        const hoursUntilLesson = (lessonDateTime - now) / (1000 * 60 * 60);

        // Determine refund percentage
        let refundPercent = 0;
        let refundReason = '';

        if (cancelledBy === 'teacher') {
            refundPercent = 100;
            refundReason = 'Teacher cancelled';
        } else {
            // Student cancellation
            if (hoursUntilLesson > 24) {
                refundPercent = 100;
                refundReason = 'Cancelled >24h before';
            } else if (hoursUntilLesson > 12) {
                refundPercent = 50;
                refundReason = 'Cancelled 12-24h before';
            } else {
                refundPercent = 0;
                refundReason = 'Cancelled <12h before (no refund policy)';
            }
        }

        // Delete Daily.co room if exists
        if (data.meetingLink) {
            try {
                const roomName = data.meetingLink.split('/').pop();
                await axios.delete(`https://api.daily.co/v1/rooms/${roomName}`, {
                    headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` }
                });
                console.log('Room deleted:', roomName);
            } catch (err) {
                console.warn('Room deletion failed:', err.message);
            }
        }

        // Process refund if applicable
        let refundId = null;
        if (refundPercent > 0 && (data.paymentIntentId || data.sessionId)) {
            try {
                let paymentIntentId = data.paymentIntentId;

                if (!paymentIntentId && data.sessionId) {
                    const session = await stripe.checkout.sessions.retrieve(data.sessionId);
                    paymentIntentId = session.payment_intent;
                }

                if (paymentIntentId) {
                    const refundAmount = Math.floor(data.amountPaid * 100 * (refundPercent / 100));

                    const refund = await stripe.refunds.create({
                        payment_intent: paymentIntentId,
                        amount: refundAmount,
                        reason: 'requested_by_customer',
                        metadata: {
                            bookingId: bookingId,
                            cancelledBy: cancelledBy,
                            refundPercent: String(refundPercent),
                            cancellationReason: reason || 'No reason provided'
                        }
                    });

                    refundId = refund.id;
                    console.log(`Refund created: ${refundPercent}% = £${(refundAmount / 100).toFixed(2)}`);
                }
            } catch (err) {
                console.error('Refund failed:', err.message);
                return res.status(500).json({ error: 'Refund processing failed: ' + err.message });
            }
        }

        // Update booking
        await ref.update({
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            cancelledBy: cancelledBy,
            cancellationReason: reason || 'No reason provided',
            refundPercent: refundPercent,
            refundId: refundId,
            meetingLink: null
        });

        // Send emails
        try {
            const teacherRef = adminDb.collection('users').doc(data.teacherId);
            const studentRef = adminDb.collection('users').doc(data.studentId);
            const [teacherSnap, studentSnap] = await Promise.all([
                teacherRef.get(),
                studentRef.get(),
            ]);

            const teacher = teacherSnap.data() || {};
            const student = studentSnap.data() || {};

            if (cancelledBy === 'student') {
                // Email to teacher
                await sendMail({
                    to: teacher.email,
                    subject: '🚫 Lesson Cancelled by Student',
                    html: `
            <p>Hi ${teacher.name},</p>
            <p>Your lesson with <b>${student.name}</b> has been cancelled.</p>
            <p><b>Date:</b> ${data.date}</p>
            <p><b>Time:</b> ${data.startTime}</p>
            ${reason ? `<p><b>Reason:</b> ${reason}</p>` : ''}
            <p>This time slot is now available for other bookings.</p>
          `
                });

                // Email to student
                await sendMail({
                    to: student.email,
                    subject: '✓ Lesson Cancellation Confirmed',
                    html: `
            <p>Hi ${student.name},</p>
            <p>Your lesson has been cancelled.</p>
            <p><b>Teacher:</b> ${teacher.name}</p>
            <p><b>Date:</b> ${data.date}</p>
            <p><b>Time:</b> ${data.startTime}</p>
            ${refundPercent > 0 ? `
              <p><b>Refund:</b> ${refundPercent}% (£${((data.amountPaid * refundPercent) / 100).toFixed(2)}) will be processed to your original payment method within 5-10 business days.</p>
            ` : `
              <p><b>Refund:</b> Unfortunately, cancellations made less than 12 hours before the lesson are not eligible for refund per our cancellation policy.</p>
            `}
          `
                });
            } else {
                // Teacher cancelled
                await sendMail({
                    to: student.email,
                    subject: '😔 Lesson Cancelled by Teacher',
                    html: `
            <p>Hi ${student.name},</p>
            <p>Unfortunately, your lesson with <b>${teacher.name}</b> has been cancelled by the teacher.</p>
            <p><b>Date:</b> ${data.date}</p>
            <p><b>Time:</b> ${data.startTime}</p>
            ${reason ? `<p><b>Reason:</b> ${reason}</p>` : ''}
            <p><b>Refund:</b> Full refund of £${data.amountPaid.toFixed(2)} will be processed within 5-10 business days.</p>
            <p>You can book another lesson with a different teacher.</p>
          `
                });
            }
        } catch (err) {
            console.warn('Email notification failed:', err.message);
        }

        return res.status(200).json({
            success: true,
            refundPercent: refundPercent,
            refundId: refundId,
            message: `Lesson cancelled. ${refundPercent}% refund processed.`
        });

    } catch (error) {
        console.error('Cancel booking error:', error);
        return res.status(500).json({ error: error.message });
    }
}
