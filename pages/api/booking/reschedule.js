// pages/api/booking/reschedule.js
/**
 * Request reschedule for a lesson
 * Student or teacher can initiate
 */

import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { bookingId, newDate, newStartTime, requestedBy, reason } = req.body;

    if (!bookingId || !newDate || !newStartTime || !requestedBy) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (requestedBy !== 'student' && requestedBy !== 'teacher') {
        return res.status(400).json({ error: 'Invalid requestedBy value' });
    }

    try {
        const ref = adminDb.collection('bookings').doc(bookingId);
        const snap = await ref.get();

        if (!snap.exists) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const data = snap.data();

        // Validate: cannot reschedule past lessons
        const lessonDateTime = new Date(`${data.date}T${data.startTime}:00`);
        const now = new Date();

        if (now > lessonDateTime) {
            return res.status(400).json({
                error: 'Cannot reschedule past lessons'
            });
        }

        // Check if already pending
        if (data.rescheduleStatus === 'pending') {
            return res.status(400).json({
                error: 'A reschedule request is already pending for this lesson'
            });
        }

        // Save reschedule request
        await ref.update({
            rescheduleStatus: 'pending',
            rescheduleRequest: {
                newDate,
                newStartTime,
                requestedBy,
                reason: reason || '',
                requestedAt: new Date().toISOString()
            }
        });

        console.log(`📅 Reschedule requested by ${requestedBy}:`, {
            booking: bookingId,
            from: `${data.date} ${data.startTime}`,
            to: `${newDate} ${newStartTime}`
        });

        // Get users
        const teacherRef = adminDb.collection('users').doc(data.teacherId);
        const studentRef = adminDb.collection('users').doc(data.studentId);
        const [teacherSnap, studentSnap] = await Promise.all([
            teacherRef.get(),
            studentRef.get()
        ]);

        const teacher = teacherSnap.data() || {};
        const student = studentSnap.data() || {};

        // Notify the other party
        const notifyEmail = requestedBy === 'student' ? teacher.email : student.email;
        const notifyName = requestedBy === 'student' ? teacher.name : student.name;
        const requesterName = requestedBy === 'student' ? student.name : teacher.name;

        await sendMail({
            to: notifyEmail,
            subject: '⏰ Lesson Reschedule Request',
            html: `
        <h2>Reschedule Request</h2>
        <p>Hi ${notifyName},</p>
        <p><b>${requesterName}</b> has requested to reschedule your lesson.</p>
        
        <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <p><b>Current Time:</b><br/>${data.date} at ${data.startTime}</p>
          <p><b>Proposed Time:</b><br/>${newDate} at ${newStartTime}</p>
          ${reason ? `<p><b>Reason:</b> ${reason}</p>` : ''}
        </div>

        <p>Please review this request in your dashboard and approve or decline.</p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${requestedBy === 'student' ? 'teacher' : 'student'}/lessons" 
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Review Request
          </a>
        </p>
      `
        });

        return res.status(200).json({
            success: true,
            message: 'Reschedule request sent'
        });

    } catch (error) {
        console.error('Reschedule request error:', error);
        return res.status(500).json({ error: error.message });
    }
}
