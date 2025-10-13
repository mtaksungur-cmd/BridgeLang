// pages/api/auth/send-verify.js
import { adminAuth } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  try {
    const verifyLink = await adminAuth.generateEmailVerificationLink(email, {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-email`,
      handleCodeInApp: true,
    });

    await sendMail({
      to: email,
      subject: 'Verify your BridgeLang account',
      html: `
        <p>Hi ${name || ''},</p>
        <p>Welcome to BridgeLang!</p>
        <p>Click the button below to verify your email address:</p>
        <p>
          <a href="${verifyLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">Verify Email</a>
        </p>
        <p>If you didn’t create this account, please ignore this email.</p>
      `,
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('send-verify error:', e);
    res.status(500).json({ error: 'send_failed' });
  }
}
