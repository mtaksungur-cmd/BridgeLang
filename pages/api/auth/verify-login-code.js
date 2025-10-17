import { adminDb, adminAuth } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Missing email or code' });

    const snap = await adminDb.collection('loginCodes').where('email', '==', email).limit(1).get();
    if (snap.empty) return res.status(400).json({ error: 'No code found' });

    const docSnap = snap.docs[0];
    const { code: savedCode, expiresAt } = docSnap.data();

    if (Date.now() > expiresAt) return res.status(400).json({ error: 'Code expired' });
    if (savedCode !== code.trim()) return res.status(400).json({ error: 'Invalid code' });

    const userRecord = await adminAuth.getUserByEmail(email);
    await adminDb.collection('loginCodes').doc(userRecord.uid).delete(); // kodu kullanıldıktan sonra sil

    res.json({ ok: true, uid: userRecord.uid });
  } catch (err) {
    console.error('verify-login-code error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
