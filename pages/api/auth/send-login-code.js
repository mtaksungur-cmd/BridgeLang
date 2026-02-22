import { adminDb } from '../../../lib/firebaseAdmin';
import crypto from 'crypto';
import { sendLoginCode } from '../../../lib/authEmails';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { uid, email } = req.body;
    if (!uid || !email) return res.status(400).json({ error: 'Missing data' });

    const userSnap = await adminDb.collection('users').doc(uid).get();
    if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });

    const userData = userSnap.data();
    const status = userData?.status || 'active';

    // If paused, send reactivation link
    if (status === 'paused') {
      const token = crypto.randomBytes(32).toString('hex');
      
      await adminDb.collection('users').doc(uid).update({
        status: 'paused',
        reactivationToken: token,
        pausedAt: new Date()
      });

      const reactivateUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/account/reactivate?token=${token}&uid=${uid}`;

      // Use modern email (simple inline for paused accounts)
      const { sendMail } = require('../../../lib/mailer');
      await sendMail({
        to: email,
        subject: '🔓 Reactivate Your BridgeLang Account',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; borderRadius: 12px;">
            <h2 style="color: #f59e0b;">🔓 Account Paused</h2>
            <p>Hi <strong>${userData?.name || 'there'}</strong>,</p>
            <p>Your BridgeLang account is currently paused.</p>
            <p>Click the button below to reactivate it and continue:</p>
            <a href="${reactivateUrl}" style="display:inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reactivate My Account</a>
            <p style="margin-top: 20px; color: #64748b; font-size: 12px;">If you didn't request this, please contact support.</p>
          </div>
        `,
      });

      return res.json({ ok: true, paused: true });
    }

    // Active account - send 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    await adminDb.collection('loginCodes').doc(uid).set({
      email,
      code,
      expiresAt,
    });

    await sendLoginCode({
      to: email,
      userName: userData?.name || '',
      code,
    });

    return res.json({ ok: true, paused: false });
  } catch (err) {
    console.error('send-login-code error:', err);
    return res.status(500).json({ error: 'Failed to send code' });
  }
}
