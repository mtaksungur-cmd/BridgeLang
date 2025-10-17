import { adminDb, adminAuth } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Missing email or code' });

    // 🔹 Firebase üzerinden kullanıcıyı bul
    const userRecord = await adminAuth.getUserByEmail(email);
    if (!userRecord?.uid) return res.status(400).json({ error: 'User not found' });

    // 🔹 Kod doğrulaması
    const ref = adminDb.collection('loginCodes').doc(userRecord.uid);
    const snap = await ref.get();
    if (!snap.exists) return res.status(400).json({ error: 'No active code found' });

    const data = snap.data();
    if (Date.now() > data.expiresAt) {
      await ref.delete();
      return res.status(400).json({ error: 'Code expired' });
    }
    if (data.code !== code.trim()) return res.status(400).json({ error: 'Invalid code' });

    // 🔹 Kod doğruysa sil
    await ref.delete();

    // 🔹 Kullanıcı rolünü Firestore’dan çek
    const userDoc = await adminDb.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const role = userData?.role || 'student';

    // 🔹 Frontend’e role ile dön
    return res.json({ ok: true, uid: userRecord.uid, role });
  } catch (err) {
    console.error('verify-login-code error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
