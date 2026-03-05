import { adminDb } from '../../../lib/firebaseAdmin';
import crypto from 'crypto';
import { sendMail } from '../../../lib/mailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });

    const users = await adminDb
      .collection('users')
      .where('email', '==', email)
      .where('status', '==', 'paused')
      .limit(1)
      .get();

    if (users.empty) return res.status(404).json({ error: 'Paused user not found' });

    const userRef = users.docs[0].ref;
    const user = users.docs[0].data();

    const unpauseToken = crypto.randomBytes(32).toString('hex');
    const unpauseHash = crypto
      .createHmac('sha256', process.env.UNPAUSE_TOKEN_SECRET)
      .update(unpauseToken)
      .digest('hex');

    await userRef.update({
      unpauseHash,
      unpauseExpires: Date.now() + 48 * 60 * 60 * 1000,
    });

    const unpauseLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/account/unpause?token=${unpauseToken}`;

    await sendMail({
      to: user.email,
      subject: '🔓 Reactivate your BridgeLang account',
      html: `
        <p>Hi ${user.name || ''},</p>
        <p>Your account is currently paused. You can reactivate it using the link below:</p>
        <p><a href="${unpauseLink}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Reactivate Account</a></p>
        <p>This link will expire in 48 hours.</p>
      `,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('resend-unpause error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
