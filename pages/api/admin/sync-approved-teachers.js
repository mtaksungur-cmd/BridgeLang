// One-time sync: set approved: true for teachers that have status === 'approved'
// so student/teachers list shows all real approved teachers from DB.
import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const snap = await adminDb
      .collection('users')
      .where('role', '==', 'teacher')
      .where('status', '==', 'approved')
      .get();

    const batch = adminDb.batch();
    let updated = 0;

    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.approved === true) return;
      batch.update(docSnap.ref, { approved: true });
      updated++;
    });

    if (updated > 0) await batch.commit();

    return res.status(200).json({
      ok: true,
      updated,
      totalTeachers: snap.size,
      message: `Set approved: true for ${updated} teacher(s).`,
    });
  } catch (err) {
    console.error('sync-approved-teachers error:', err);
    return res.status(500).json({ error: err.message });
  }
}
