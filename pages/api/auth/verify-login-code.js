import { adminDb, adminAuth } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Missing email or code' });

    // 🔹 Kullanıcı kaydını çek (email → uid)
    const userRecord = await adminAuth.getUserByEmail(email);
    if (!userRecord?.uid) return res.status(400).json({ error: 'User not found' });

    // 🔹 loginCodes/{uid} dokümanını oku
    const ref = adminDb.collection('loginCodes').doc(userRecord.uid);
    const snap = await ref.get();
    if (!snap.exists) return res.status(400).json({ error: 'No active code found' });

    const data = snap.data();
    const { code: savedCode, expiresAt } = data;

    if (Date.now() > expiresAt) {
      await ref.delete();
      return res.status(400).json({ error: 'Code expired' });
    }

    if (savedCode !== code.trim()) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    // ✅ Kod doğruysa: tek seferlik olduğundan sil
    await ref.delete();

    return res.json({ ok: true, uid: userRecord.uid });
  } catch (err) {
    console.error('verify-login-code error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
