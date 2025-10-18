import { adminDb, adminAuth } from '../../../lib/firebaseAdmin';
import crypto from 'crypto';
import { sendMail } from '../../../lib/mailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const userRef = adminDb.collection('users').doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });
    const user = snap.data();

    const unpauseToken = crypto.randomBytes(32).toString('hex');
    const unpauseHash = crypto
      .createHmac('sha256', process.env.UNPAUSE_TOKEN_SECRET)
      .update(unpauseToken)
      .digest('hex');

    await userRef.update({
      status: 'paused',
      pausedAt: Date.now(),
      unpauseHash,
      unpauseExpires: Date.now() + 48 * 60 * 60 * 1000, // 48h
    });

    const unpauseLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/account/unpause?token=${unpauseToken}`;

    await sendMail({
      to: user.email,
      subject: '🔓 Reactivate your BridgeLang account',
      html: `
        <p>Hi ${user.name || ''},</p>
        <p>Your BridgeLang account has been paused.</p>
        <p>You can reactivate it anytime by clicking the link below:</p>
        <p><a href="${unpauseLink}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Reactivate Account</a></p>
        <p>This link will expire in 48 hours.</p>
      `,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('pause error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
