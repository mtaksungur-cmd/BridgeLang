import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { uid, email } = req.body;
    if (!uid || !email) return res.status(400).json({ error: 'Missing data' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 dakika geçerli

    await adminDb.collection('loginCodes').doc(uid).set({ email, code, expiresAt });

    await sendMail({
      to: email,
      subject: 'Your BridgeLang Login Code',
      html: `
        <p>Hi,</p>
        <p>Your login verification code is:</p>
        <h2 style="font-size:28px;letter-spacing:2px;">${code}</h2>
        <p>This code will expire in 10 minutes.</p>
      `,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('send-login-code error:', err);
    return res.status(500).json({ error: 'Failed to send code' });
  }
}
