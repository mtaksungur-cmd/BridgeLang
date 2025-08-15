// pages/api/booking/send-reminders.js
import { adminDb } from '../../../lib/firebaseAdmin';
import { sendLessonReminder } from '../../../lib/mailer';
import { DateTime } from 'luxon';

export default async function handler(req, res) {
  const secret = req.headers['x-cron-secret'];
  if (secret !== process.env.REMINDER_CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.method !== 'POST') return res.status(405).end();

  const nowUtc = DateTime.utc().toMillis();
  const minTs = nowUtc + 55 * 60 * 1000;
  const maxTs = nowUtc + 65 * 60 * 1000;

  try {
    const snap = await adminDb
      .collection('bookings')
      .where('reminderSent', '==', false)
      .get();

    let sent = 0;
    const batch = adminDb.batch();

    for (const docSnap of snap.docs) {
      const b = docSnap.data();
      if (!b.startAtUtc) continue;

      if (b.startAtUtc >= minTs && b.startAtUtc <= maxTs) {
        try {
          const studentDoc = await adminDb.collection('users').doc(b.studentId).get();
          const student = studentDoc.exists ? studentDoc.data() : null;

          const teacherDoc = await adminDb.collection('users').doc(b.teacherId).get();
          const teacher = teacherDoc.exists ? teacherDoc.data() : null;

          if (student?.email) {
            await sendLessonReminder({
              to: student.email,
              name: student.name,
              role: 'student',
              startISO: DateTime.fromMillis(b.startAtUtc).setZone('Europe/Istanbul').toISO(),
              meetingLink: b.meetingLink || ''
            });
          }

          if (teacher?.email) {
            await sendLessonReminder({
              to: teacher.email,
              name: teacher.name,
              role: 'teacher',
              startISO: DateTime.fromMillis(b.startAtUtc).setZone('Europe/Istanbul').toISO(),
              meetingLink: b.meetingLink || ''
            });
          }

          batch.update(docSnap.ref, { reminderSent: true });
          sent++;
        } catch (err) {
          console.error('Reminder send failed for booking', docSnap.id, err);
        }
      }
    }

    if (sent > 0) {
      await batch.commit();
    }

    res.status(200).json({ sent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
}
