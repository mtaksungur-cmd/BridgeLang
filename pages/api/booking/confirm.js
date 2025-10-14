// pages/api/booking/confirm.js
import { db } from '../../../lib/firebase';
import { adminDb } from '../../../lib/firebaseAdmin';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { sendMail } from '../../../lib/mailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { bookingId, role } = req.body;
  if (!bookingId || !['student', 'teacher'].includes(role)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const ref = doc(db, 'bookings', bookingId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return res.status(404).json({ error: 'Not found' });

  const data = snap.data();
  const updates =
    role === 'student' ? { studentConfirmed: true } : { teacherApproved: true };

  await updateDoc(ref, updates);

  /* --- Mail gönderimi --- */
  try {
    // Kullanıcı bilgilerini getir
    const teacherRef = doc(db, 'users', data.teacherId);
    const studentRef = doc(db, 'users', data.studentId);
    const [teacherSnap, studentSnap] = await Promise.all([
      getDoc(teacherRef),
      getDoc(studentRef),
    ]);

    const teacher = teacherSnap.data() || {};
    const student = studentSnap.data() || {};

    // Ortak ders bilgileri
    const baseInfo = `
      <p><b>Date:</b> ${data.date}</p>
      <p><b>Time:</b> ${data.startTime} – ${data.endTime}</p>
      <p><b>Location:</b> ${data.location || 'Not specified'}</p>
    `;

    if (role === 'student' && !data.teacherApproved) {
      // 🔹 Öğrenci onayladı → öğretmene mail
      await sendMail({
        to: teacher.email,
        subject: `✅ ${student.name || 'A student'} confirmed the lesson`,
        html: `
          <p>Hi ${teacher.name || 'Teacher'},</p>
          <p>Your student <b>${student.name || 'Student'}</b> has confirmed the lesson completion.</p>
          ${baseInfo}
          <p>Please review and confirm the lesson to receive your payment.</p>
          <p>BridgeLang Teacher Portal</p>
        `,
      });
    }

    if (role === 'teacher' && !data.studentConfirmed) {
      // 🔹 Öğretmen onayladı → öğrenciye mail
      await sendMail({
        to: student.email,
        subject: `📘 Your teacher confirmed the lesson`,
        html: `
          <p>Hi ${student.name || 'Student'},</p>
          <p>Your teacher <b>${teacher.name || 'Teacher'}</b> has confirmed that the lesson was completed.</p>
          ${baseInfo}
          <p>Please confirm the lesson if it was successfully completed to finalize the process.</p>
          <p>BridgeLang Student Portal</p>
        `,
      });
    }
  } catch (e) {
    console.warn('⚠️ Lesson confirmation mail failed:', e.message);
  }

  // --- İki taraf da onayladıysa dersi onayla ---
  if (
    (role === 'student' && data.teacherApproved) ||
    (role === 'teacher' && data.studentConfirmed)
  ) {
    await updateDoc(ref, { status: 'approved' });
  }

  res.status(200).json({ success: true });
}
