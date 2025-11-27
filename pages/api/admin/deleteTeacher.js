import { adminDb, adminAuth } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { teacherId, teacherEmail, teacherName } = req.body;

  if (!teacherId) {
    return res.status(400).json({ error: 'Missing teacherId' });
  }

  try {
    // 🔹 users/{teacherId} dokümanını sil
    await adminDb.collection('users').doc(teacherId).delete();

    // 🔹 Firebase Auth hesabını sil
    try {
      await adminAuth.deleteUser(teacherId);
      console.log(`🗑️ Auth user deleted: ${teacherId}`);
    } catch (authErr) {
      console.warn('⚠️ Auth deletion failed:', authErr.message);
    }

    // İstersen ileride: deletedTeachers koleksiyonuna log atılabilir

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('deleteTeacher API error:', err);
    return res.status(500).json({ error: 'Delete failed' });
  }
}
