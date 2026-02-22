import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });
    const userData = userSnap.data();

    const token = crypto.randomBytes(32).toString('hex');
    
    await userRef.update({
      status: 'paused',
      reactivationToken: token,
      pausedAt: new Date()
    });

    const reactivateUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/account/reactivate?token=${token}&uid=${userId}`;

    await sendMail({
      to: userData.email,
      subject: 'Your BridgeLang account has been paused',
      html: `
        <p>Hi ${userData.name || 'there'},</p>
        <p>As requested, your account has been temporarily paused. You have been logged out of all devices.</p>
        <p>To reactivate your account and resume learning, click the link below:</p>
        <p><a href="${reactivateUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Reactivate My Account</a></p>
        <p>If you didn't request this, please contact support immediately.</p>
      `
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Pause API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
