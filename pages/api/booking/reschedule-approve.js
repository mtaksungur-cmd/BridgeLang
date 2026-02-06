// pages/api/booking/reschedule-approve.js
/**
 * Approve a reschedule request
 * Deletes old Daily.co room and creates new one
 */

import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';
import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { bookingId, approvedBy } = req.body;

    if (!bookingId || !approvedBy) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const ref = adminDb.collection('bookings').doc(bookingId);
        const snap = await ref.get();

        if (!snap.exists) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const data = snap.data();

        if (data.rescheduleStatus !== 'pending') {
            return res.status(400).json({
                error: 'No pending reschedule request'
            });
        }

        const { newDate, newStartTime, requestedBy } = data.rescheduleRequest;

        // Validate: approver must be the other party
        if (
            (requestedBy === 'student' && approvedBy !== 'teacher') ||
            (requestedBy === 'teacher' && approvedBy !== 'student')
        ) {
            return res.status(403).json({
                error: 'Only the other party can approve reschedule'
            });
        }

        console.log(`✅ Approving reschedule for booking ${bookingId}`);
        console.log(`  From: ${data.date} ${data.startTime}`);
        console.log(`  To: ${newDate} ${newStartTime}`);

        // Delete old Daily.co room if exists
        if (data.meetingLink) {
            try {
                const roomName = data.meetingLink.split('/').pop();
                await axios.delete(`https://api.daily.co/v1/rooms/${roomName}`, {
                    headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` }
                });
                console.log(`🗑️ Deleted old room: ${roomName}`);
            } catch (err) {
                console.warn('Failed to delete old room:', err.message);
            }
        }

        // Create new Daily.co room
        let newMeetingLink = null;
        if (data.status === 'approved') {
            // Only create if lesson was already approved
            try {
                const dailyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/daily/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: newDate,
                        startTime: newStartTime,
                        duration: data.duration || 60,
                        timezone: data.timezone || 'Europe/London'
                    })
                });

                if (dailyResponse.ok) {
                    const { url } = await dailyResponse.json();
                    newMeetingLink = url;
                    console.log(`🎥 Created new room: ${url}`);
                }
            } catch (err) {
                console.error('Failed to create new room:', err);
                // Continue without failing
            }
        }

        // Update booking
        await ref.update({
            date: newDate,
            startTime: newStartTime,
            meetingLink: newMeetingLink,
            rescheduleStatus: 'approved',
            rescheduleApprovedAt: new Date().toISOString(),
            rescheduleApprovedBy: approvedBy,
            // Keep history
            previousDate: data.date,
            previousStartTime: data.startTime,
            previousMeetingLink: data.meetingLink
        });

        // Notify both parties
        const teacherRef = adminDb.collection('users').doc(data.teacherId);
        const studentRef = adminDb.collection('users').doc(data.studentId);
        const [teacherSnap, studentSnap] = await Promise.all([
            teacherRef.get(),
            studentRef.get()
        ]);

        const teacher = teacherSnap.data() || {};
        const student = studentSnap.data() || {};

        // Email to both
        const emailPromises = [
            sendMail({
                to: teacher.email,
                subject: '✅ Lesson Rescheduled',
                html: `
          <h2>Lesson Rescheduled</h2>
          <p>Hi ${teacher.name},</p>
          <p>Your lesson with <b>${student.name}</b> has been rescheduled.</p>
          <p><b>Old Time:</b> ${data.date} at ${data.startTime}</p>
          <p><b>New Time:</b> ${newDate} at ${newStartTime}</p>
          ${newMeetingLink ? `<p><b>Video Link:</b> ${newMeetingLink}</p>` : ''}
        `
            }),
            sendMail({
                to: student.email,
                subject: '✅ Lesson Rescheduled',
                html: `
          <h2>Lesson Rescheduled</h2>
          <p>Hi ${student.name},</p>
          <p>Your lesson with <b>${teacher.name}</b> has been rescheduled.</p>
          <p><b>Old Time:</b> ${data.date} at ${data.startTime}</p>
          <p><b>New Time:</b> ${newDate} at ${newStartTime}</p>
          ${newMeetingLink ? `<p><b>Video Link:</b> ${newMeetingLink}</p>` : ''}
        `
            })
        ];

        await Promise.all(emailPromises);

        return res.status(200).json({
            success: true,
            newDate,
            newStartTime,
            newMeetingLink
        });

    } catch (error) {
        console.error('Reschedule approve error:', error);
        return res.status(500).json({ error: error.message });
    }
}
