// pages/api/cron/send-reminders.js
import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail, buildReminderEmail } from '../../../lib/mailer';

export default async function handler(req, res) {
  // --- FORCE PATH (tek booking'i anında gönder) ---
  const { forceBookingId } = req.query;
  if (forceBookingId) {
    try {
      const snap = await adminDb.collection('bookings').doc(forceBookingId).get();
      if (!snap.exists) return res.status(404).json({ error: 'Booking not found' });
      const b = snap.data();

      const [tSnap, sSnap] = await Promise.all([
        adminDb.collection('users').doc(b.teacherId).get(),
        adminDb.collection('users').doc(b.studentId).get(),
      ]);
      const teacher = tSnap.exists ? tSnap.data() : {};
      const student = sSnap.exists ? sSnap.data() : {};

      const forStudent = buildReminderEmail({
        who: 'student',
        teacherName: teacher?.name,
        studentName: student?.name,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        duration: b.duration,
        location: b.location,
        meetingLink: b.meetingLink || '',
        timezone: b.timezone || null,
      });

      const forTeacher = buildReminderEmail({
        who: 'teacher',
        teacherName: teacher?.name,
        studentName: student?.name,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        duration: b.duration,
        location: b.location,
        meetingLink: b.meetingLink || '',
        timezone: b.timezone || null,
      });

      const tasks = [];
      if (student.email) tasks.push(sendMail({ to: student.email, ...forStudent }));
      if (teacher.email) tasks.push(sendMail({ to: teacher.email, ...forTeacher }));

      const results = await Promise.allSettled(tasks);
      console.log('[force] mail results:', results);

      const allOk = results.every(r => r.status === 'fulfilled');
      if (allOk) {
        await snap.ref.update({ reminderSent: true, reminderSentAt: new Date() });
      }
      return res.status(200).json({ ok: true, forced: true, allOk });
    } catch (e) {
      console.error('[force] error:', e);
      return res.status(500).json({ ok: false, forced: true, error: e?.message || String(e) });
    }
  }

  // --- CRON PATH (60 dk kala otomatik) ---
  try {
    const now = Date.now();
    const in60 = now + 60 * 60 * 1000;
    const toleranceMs = 5 * 60 * 1000;
    const minTs = in60 - toleranceMs;
    const maxTs = in60 + toleranceMs;

    const qs = await adminDb
      .collection('bookings')
      .where('reminderSent', '==', false)
      .where('status', 'in', ['pending-approval', 'approved'])
      .where('startAtUtc', '>=', minTs)
      .where('startAtUtc', '<=', maxTs)
      .get();

    if (qs.empty) {
      return res.status(200).json({ ok: true, found: 0 });
    }

    let sent = 0;
    for (const docSnap of qs.docs) {
      const b = docSnap.data();

      const [teacherSnap, studentSnap] = await Promise.all([
        adminDb.collection('users').doc(b.teacherId).get(),
        adminDb.collection('users').doc(b.studentId).get(),
      ]);
      const teacher = teacherSnap.exists ? teacherSnap.data() : null;
      const student = studentSnap.exists ? studentSnap.data() : null;

      const teacherEmail = teacher?.email;
      const studentEmail = student?.email;

      const forStudent = buildReminderEmail({
        who: 'student',
        teacherName: teacher?.name || 'Teacher',
        studentName: student?.name || 'Student',
        date: b.date,
        startTime: b.startTime,
        meetingLink: b.meetingLink || '',
      });

      const forTeacher = buildReminderEmail({
        who: 'teacher',
        teacherName: teacher?.name || 'Teacher',
        studentName: student?.name || 'Student',
        date: b.date,
        startTime: b.startTime,
        meetingLink: b.meetingLink || '',
      });

      const tasks = [];
      if (studentEmail) tasks.push(sendMail({ to: studentEmail, ...forStudent }));
      if (teacherEmail) tasks.push(sendMail({ to: teacherEmail, ...forTeacher }));

      try {
        const results = await Promise.allSettled(tasks);
        console.log('[cron] mail results for', docSnap.id, results);
        const allOk = results.every(r => r.status === 'fulfilled');
        if (allOk) {
          await docSnap.ref.update({ reminderSent: true, reminderSentAt: new Date() });
          sent += 1;
        }
      } catch (e) {
        console.error('Reminder send error for booking', docSnap.id, e);
      }
    }

    return res.status(200).json({ ok: true, found: qs.size, sent });
  } catch (err) {
    console.error('Cron reminders error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
