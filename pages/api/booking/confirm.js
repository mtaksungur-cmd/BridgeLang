import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

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
  const updates = role === 'student' ? { studentConfirmed: true } : { teacherApproved: true };

  await updateDoc(ref, updates);

  if ((role === 'student' && data.teacherApproved) || (role === 'teacher' && data.studentConfirmed)) {
    await updateDoc(ref, { status: 'approved' });
  }

  res.status(200).json({ success: true });
}
