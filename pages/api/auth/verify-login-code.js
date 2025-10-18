// pages/api/auth/verify-login-code.js
import { adminDb, adminAuth } from '../../../lib/firebaseAdmin';
import crypto from 'crypto';
import { sendMail } from '../../../lib/mailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Missing email or code' });

    // Kullanıcıyı bul
    const userRecord = await adminAuth.getUserByEmail(email);
    if (!userRecord?.uid) return res.status(400).json({ error: 'User not found' });

    // OTP kontrolü
    const ref = adminDb.collection('loginCodes').doc(userRecord.uid);
    const snap = await ref.get();
    if (!snap.exists) return res.status(400).json({ error: 'No active code found' });

    const data = snap.data();
    if (Date.now() > data.expiresAt) {
      await ref.delete();
      return res.status(400).json({ error: 'Code expired' });
    }
    if (data.code !== code.trim()) return res.status(400).json({ error: 'Invalid code' });

    // OTP tek kullanımlık
    await ref.delete();

    // Kullanıcının application-profilini al (rol + status için)
    const userDocRef = adminDb.collection('users').doc(userRecord.uid);
    const userDoc = await userDocRef.get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const role = userData?.role || 'student';
    const status = userData?.status || 'active';

    // Eğer hesap paused ise burada login'e izin vermeyelim,
    // ayrıca re-activation mailini tekrar gönderelim.
    if (status === 'paused') {
      // Unpause token üret
      const rawToken = crypto.randomBytes(32).toString('hex');
      const unpauseHash = crypto
        .createHmac('sha256', process.env.UNPAUSE_TOKEN_SECRET)
        .update(rawToken)
        .digest('hex');

      const expiresAt = Date.now() + 48 * 60 * 60 * 1000; // 48 saat

      // Hash + expiry kaydet
      await userDocRef.update({
        unpauseHash,
        unpauseExpires: expiresAt,
      });

      const unpauseLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/account/unpause?token=${rawToken}`;

      // Mail gönder
      try {
        await sendMail({
          to: email,
          subject: '🔓 Reactivate your BridgeLang account',
          html: `
            <p>Hi ${userData?.name || ''},</p>
            <p>Your BridgeLang account is currently paused.</p>
            <p>You can reactivate it by clicking the link below:</p>
            <p><a href="${unpauseLink}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Reactivate Account</a></p>
            <p>This link will expire in 48 hours.</p>
          `,
        });
      } catch (e) {
        // mail gönderilemese de status bilgisini dönderiyoruz
        console.error('[verify-login-code] resend unpause email failed:', e);
      }

      // Token vermeden sadece durum döndür
      return res.json({
        ok: true,
        uid: userRecord.uid,
        role,
        status: 'paused',
        // token yok -> frontend login olmayacak, mesaj gösterecek
      });
    }

    // Hesap aktifse Custom Token üret ve döndür
    const token = await adminAuth.createCustomToken(userRecord.uid);

    return res.json({
      ok: true,
      uid: userRecord.uid,
      role,
      status: 'active',
      token, // frontend signInWithCustomToken için
    });
  } catch (err) {
    console.error('verify-login-code error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
