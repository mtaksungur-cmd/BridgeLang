import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  const { token, uid } = req.query;

  if (!token || !uid) return res.status(400).json({ error: 'Invalid request' });

  try {
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });
    const userData = userSnap.data();

    if (userData.reactivationToken !== token) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    await userRef.update({
      status: 'active',
      reactivationToken: null,
      reactivatedAt: new Date()
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Reactivate API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
