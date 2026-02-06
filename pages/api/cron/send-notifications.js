// pages/api/cron/send-notifications.js
/**
 * Cron job to send scheduled notifications
 * Runs every 5 minutes via Vercel Cron
 */

import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';
import { get24hReminderEmail, get1hReminderEmail, get15mReminderEmail } from '../../../lib/emailTemplates';
import { DateTime } from 'luxon';

export default async function handler(req, res) {
    // Verify cron secret for security
    const authHeader = req.headers.authorization;

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn('⚠️ Unauthorized cron attempt');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('📨 Starting notification cron job...');

    try {
        const now = DateTime.now();

        // Get pending notifications due now (with 5 min buffer)
        const fiveMinutesFromNow = now.plus({ minutes: 5 }).toISO();

        const notifications = await adminDb.collection('scheduledNotifications')
            .where('status', '==', 'pending')
            .where('scheduledFor', '<=', fiveMinutesFromNow)
            .limit(50) // Process max 50 per run
            .get();

        console.log(`📬 Found ${notifications.size} pending notifications`);

        let sent = 0;
        let failed = 0;

        for (const doc of notifications.docs) {
            const notif = doc.data();

            try {
                // Get booking details
                const bookingRef = await adminDb.collection('bookings').doc(notif.bookingId).get();

                if (!bookingRef.exists) {
                    console.warn(`⚠️ Booking ${notif.bookingId} not found, skipping notification`);
                    await doc.ref.update({ status: 'failed', error: 'Booking not found' });
                    failed++;
                    continue;
                }

                const booking = bookingRef.data();

                // Skip if booking is cancelled
                if (booking.status === 'cancelled') {
                    console.log(`🚫 Booking ${notif.bookingId} cancelled, skipping notification`);
                    await doc.ref.delete();
                    continue;
                }

                // Get user details
                const studentRef = await adminDb.collection('users').doc(notif.studentId).get();
                const teacherRef = await adminDb.collection('users').doc(notif.teacherId).get();

                const student = studentRef.data() || {};
                const teacher = teacherRef.data() || {};

                // Choose email template based on type
                let emailData;

                if (notif.type === '24h_reminder') {
                    emailData = get24hReminderEmail({
                        studentName: student.name,
                        teacherName: teacher.name,
                        date: booking.date,
                        startTime: booking.startTime,
                        timezone: booking.timezone || 'Europe/London',
                        duration: booking.duration || 60
                    });
                } else if (notif.type === '1h_reminder') {
                    emailData = get1hReminderEmail({
                        studentName: student.name,
                        teacherName: teacher.name,
                        startTime: booking.startTime,
                        timezone: booking.timezone || 'Europe/London'
                    });
                } else if (notif.type === '15m_reminder') {
                    emailData = get15mReminderEmail({
                        studentName: student.name,
                        teacherName: teacher.name,
                        meetingLink: booking.meetingLink
                    });
                }

                if (emailData) {
                    // Send email
                    await sendMail({
                        to: student.email,
                        subject: emailData.subject,
                        html: emailData.html
                    });

                    console.log(`✅ Sent ${notif.type} for booking ${notif.bookingId} to ${student.email}`);

                    // Mark as sent
                    await doc.ref.update({
                        status: 'sent',
                        sentAt: now.toISO()
                    });

                    sent++;
                }

            } catch (error) {
                console.error(`❌ Failed to send notification ${doc.id}:`, error);

                await doc.ref.update({
                    status: 'failed',
                    error: error.message,
                    failedAt: now.toISO()
                });

                failed++;
            }
        }

        console.log(`📊 Cron job complete: ${sent} sent, ${failed} failed`);

        return res.status(200).json({
            success: true,
            sent,
            failed,
            total: notifications.size
        });

    } catch (error) {
        console.error('❌ Cron job error:', error);
        return res.status(500).json({ error: error.message });
    }
}
