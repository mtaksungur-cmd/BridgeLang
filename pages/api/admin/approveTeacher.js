// pages/api/admin/approveTeacher.js
import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { teacher } = req.body;
  if (!teacher?.id) return res.status(400).json({ error: 'Missing teacher ID' });

  try {
    // Teacher'ı users koleksiyonuna taşı
    await adminDb.collection('users').doc(teacher.id).set(
      {
        ...teacher,
        role: 'teacher',
        status: 'approved',
        emailVerified: true,
      },
      { merge: true }
    );

    // PendingTeachers'tan sil
    await adminDb.collection('pendingTeachers').doc(teacher.id).delete();

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('approveTeacher API error:', err);
    return res.status(500).json({ error: 'Approval failed' });
  }
}
