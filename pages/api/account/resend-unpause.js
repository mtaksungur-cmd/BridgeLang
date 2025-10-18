import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });

    const users = await adminDb.collection('users').where('email', '==', email).limit(1).get();
    if (users.empty) return res.status(404).json({ error: 'User not found' });

    const userRef = users.docs[0].ref;
    const user = users.docs[0].data();

    if (user.status !== 'paused') return res.status(400).json({ error: 'Account is not paused' });

    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto
      .createHmac('sha256', process.env.UNPAUSE_TOKEN_SECRET)
      .update(token)
      .digest('hex');

    await userRef.update({
      unpauseHash: hash,
      unpauseExpires: Date.now() + 48 * 60 * 60 * 1000,
    });

    const unpauseLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/account/unpause?token=${token}`;

    await sendMail({
      to: email,
      subject: '🔓 Reactivate your BridgeLang account',
      html: `
        <p>Hi ${user.name || ''},</p>
        <p>Your BridgeLang account is currently paused.</p>
        <p>You can reactivate it anytime by clicking the link below:</p>
        <p><a href="${unpauseLink}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Reactivate Account</a></p>
        <p>This link will expire in 48 hours.</p>
      `,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('resend-unpause error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
