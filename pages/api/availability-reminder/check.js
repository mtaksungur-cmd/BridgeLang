// pages/api/availability-reminder/check.js - PHASE 13 Implementation
import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Get all profile views from last 7 days
        const viewsSnap = await adminDb.collection('profileViews')
            .where('viewedAt', '>=', sevenDaysAgo)
            .get();

        const processedPairs = new Set();

        for (const viewDoc of viewsSnap.docs) {
            const view = viewDoc.data();
            const { studentId, teacherId, viewedAt } = view;
            const pairKey = `${studentId}_${teacherId}`;

            if (processedPairs.has(pairKey)) continue;

            // Check if already sent notification in last 24h
            const recentNotificationSnap = await adminDb.collection('availabilityNotifications')
                .where('studentId', '==', studentId)
                .where('teacherId', '==', teacherId)
                .where('sentAt', '>=', twentyFourHoursAgo)
                .limit(1)
                .get();

            if (!recentNotificationSnap.empty) {
                console.log(`Skip: Recent notification sent for ${pairKey}`);
                continue;
            }

            // Check if student booked this teacher in last 48h
            const recentBookingSnap = await adminDb.collection('bookings')
                .where('studentId', '==', studentId)
                .where('teacherId', '==', teacherId)
                .where('createdAt', '>=', fortyEightHoursAgo)
                .limit(1)
                .get();

            if (!recentBookingSnap.empty) {
                console.log(`Skip: Recent booking exists for ${pairKey}`);
                continue;
            }

            // Check if teacher added availability in last 48h
            const teacherSnap = await adminDb.collection('users').doc(teacherId).get();
            if (!teacherSnap.exists) continue;

            const teacherData = teacherSnap.data();
            const lastAvailabilityUpdate = teacherData.lastAvailabilityUpdate?.toDate();

            if (!lastAvailabilityUpdate || lastAvailabilityUpdate < fortyEightHoursAgo) {
                console.log(`Skip: No recent availability update for ${teacherId}`);
                continue;
            }

            // Check student notification preferences
            const studentSnap = await adminDb.collection('users').doc(studentId).get();
            if (!studentSnap.exists) continue;

            const studentData = studentSnap.data();
            if (studentData.disableAvailabilityReminders === true) {
                console.log(`Skip: Student ${studentId} disabled reminders`);
                continue;
            }

            // ✅ Send notification
            const notificationData = {
                studentId,
                teacherId,
                teacherName: teacherData.name,
                sentAt: new Date(),
                reason: 'teacher_available_after_view',
                viewedAt: viewedAt.toDate ? viewedAt.toDate() : viewedAt
            };

            await adminDb.collection('availabilityNotifications').add(notificationData);

            // Send email
            if (studentData.emailNotifications !== false) {
                try {
                    await sendMail({
                        to: studentData.email,
                        subject: `${teacherData.name} has new availability!`,
                        html: `
              <p>Hi ${studentData.name || 'there'},</p>
              <p>Good news! <b>${teacherData.name}</b>, a tutor you recently viewed, has just added new availability.</p>
              <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/student/book/${teacherId}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:6px;">View Available Times</a></p>
              <p>Book now before slots fill up!</p>
              <p style="font-size:0.875rem;color:#64748b;">You can disable these reminders in your <a href="${process.env.NEXT_PUBLIC_BASE_URL}/student/settings">account settings</a>.</p>
            `,
                    });
                    console.log(`✉️ Sent reminder: ${studentId} → ${teacherId}`);
                } catch (mailErr) {
                    console.warn('Reminder email failed:', mailErr.message);
                }
            }

            processedPairs.add(pairKey);
        }

        return res.status(200).json({
            success: true,
            processed: processedPairs.size
        });

    } catch (err) {
        console.error('Availability reminder error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
