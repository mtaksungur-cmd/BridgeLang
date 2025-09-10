// pages/api/admin/rejectTeacher.js
import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { teacherId } = req.body;
  if (!teacherId) return res.status(400).json({ error: 'Missing teacher ID' });

  try {
    await adminDb.collection('pendingTeachers').doc(teacherId).delete();
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('rejectTeacher API error:', err);
    return res.status(500).json({ error: 'Rejection failed' });
  }
}
