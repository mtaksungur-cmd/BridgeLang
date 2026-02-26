// Rollback a student account when parent-consent email failed (so they can retry registration).
import { adminDb, adminAuth } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!adminAuth || !adminDb) {
    return res.status(503).json({ error: 'Server not configured for rollback.' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
    }
    const idToken = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userSnap.data();
    if (user.status !== 'pending_consent') {
      return res.status(403).json({ error: 'Only pending-consent accounts can be rolled back.' });
    }

    await userRef.delete();
    await adminAuth.deleteUser(uid);

    return res.json({ ok: true });
  } catch (err) {
    console.error('rollback-student-registration error:', err);
    return res.status(500).json({ error: 'Rollback failed.', details: err.message });
  }
}
