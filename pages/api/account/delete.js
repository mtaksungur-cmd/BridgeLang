import { adminDb } from '../../../lib/firebaseAdmin';
import crypto from 'crypto';
import { getAuth } from 'firebase-admin/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = await getAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });

    const user = userSnap.data();

    const emailHash = crypto.createHash('sha256').update(user.email).digest('hex');
    await adminDb.collection('deletedEmails').doc(emailHash).set({
      email: user.email,
      deletedAt: Date.now(),
    });

    await userRef.delete();

    return res.json({ ok: true });
  } catch (err) {
    console.error('delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
