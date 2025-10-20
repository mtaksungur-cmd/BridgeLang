import { adminDb } from '../../../lib/firebaseAdmin';
import crypto from 'crypto';
import { sendMail } from '../../../lib/mailer';

export default async function handler(req, res) {
    const { uid, email } = req.body;
    if (!uid || !email) return res.status(400).json({ error: 'Missing data' });

    // 🔹 Önce kullanıcı durumunu kontrol et
    const userSnap = await adminDb.collection('users').doc(uid).get();
    if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });

    const userData = userSnap.data();
    const status = userData?.status || 'active';

    // ------------------------------------------------------
    // 🟡 Eğer hesap "paused" ise kod oluşturma, link gönder
    // ------------------------------------------------------
    if (status === 'paused') {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const unpauseHash = crypto
        .createHmac('sha256', process.env.UNPAUSE_TOKEN_SECRET)
        .update(rawToken)
        .digest('hex');
      const expiresAt = Date.now() + 48 * 60 * 60 * 1000; // 48 saat

      await adminDb.collection('users').doc(uid).update({
        unpauseHash,
        unpauseExpires: expiresAt,
      });

      const unpauseLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/account/unpause?token=${rawToken}`;

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

      console.log(`[send-login-code] Account paused → reactivation email sent to ${email}`);
      return res.json({ ok: true, paused: true });
    }

    // ------------------------------------------------------
    // 🟢 Hesap aktifse normal 6 haneli kod oluştur
    // ------------------------------------------------------
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 dakika geçerli

    await adminDb.collection('loginCodes').doc(uid).set({
      email,
      code,
      expiresAt,
    });

    await sendMail({
      to: email,
      subject: 'Your BridgeLang Login Code',
      html: `
        <p>Hi ${userData?.name || ''},</p>
        <p>Your login verification code is:</p>
        <h2 style="font-size:28px;letter-spacing:2px;">${code}</h2>
        <p>This code will expire in 10 minutes.</p>
      `,
    });

    console.log(`[send-login-code] OTP sent to ${email}`);
    return res.json({ ok: true, paused: false });
  } catch (err) {
    console.error('send-login-code error:', err);
    return res.status(500).json({ error: 'Failed to send code' });
  }
}
