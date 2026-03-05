import { adminAuth, adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();

  if (!adminAuth || !adminDb) {
    console.error('[/api/auth/me] Firebase Admin not initialized');
    return res.status(500).json({ error: 'server-config-error' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const idToken = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      const pendingDoc = await adminDb.collection('pendingTeachers').doc(uid).get();
      if (pendingDoc.exists()) {
        return res.json({ uid, role: 'pending_teacher', status: 'pending' });
      }
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const status = userData?.status || 'active';

    let role = userData?.role || null;
    if (role !== 'admin') {
      const isTeacher =
        userData?.role === 'teacher' ||
        userData?.approved !== undefined ||
        userData?.pricing30 !== undefined ||
        userData?.stripeOnboarded !== undefined ||
        userData?.specialties !== undefined;
      role = isTeacher ? 'teacher' : (userData?.role || 'student');
    }

    return res.json({ uid, role, status });
  } catch (err) {
    console.error('[/api/auth/me] Error:', err.message);
    if (
      err.code === 'auth/id-token-expired' ||
      err.code === 'auth/argument-error' ||
      err.code === 'auth/id-token-revoked'
    ) {
      return res.status(401).json({ error: 'token-expired' });
    }
    return res.status(500).json({ error: 'server-error' });
  }
}
