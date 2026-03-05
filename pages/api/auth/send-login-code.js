import { adminDb } from '../../../lib/firebaseAdmin';
import crypto from 'crypto';
import { sendLoginCode } from '../../../lib/authEmails';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!adminDb) {
    console.error('send-login-code error: Firebase Admin is not initialized');
    return res.status(500).json({ error: 'server-config-error' });
  }

  const { uid, email } = req.body;
  if (!uid || !email) return res.status(400).json({ error: 'Missing data' });

  // --- Firestore read (Firebase Admin credentials check) ---
  let userSnap;
  try {
    userSnap = await adminDb.collection('users').doc(uid).get();
  } catch (dbErr) {
    console.error('send-login-code Firestore read error:', dbErr.code, dbErr.message);
    return res.status(500).json({ error: 'server-config-error' });
  }

  if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });

  const userData = userSnap.data();
  const status = userData?.status || 'active';

  // If paused, send reactivation link
  if (status === 'paused') {
    const token = crypto.randomBytes(32).toString('hex');
    try {
      await adminDb.collection('users').doc(uid).update({
        status: 'paused',
        reactivationToken: token,
        pausedAt: new Date(),
      });

      const reactivateUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/account/reactivate?token=${token}&uid=${uid}`;
      const { sendMail } = await import('../../../lib/mailer.js');
      await sendMail({
        to: email,
        subject: '🔓 Reactivate Your BridgeLang Account',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #f59e0b;">🔓 Account Paused</h2>
            <p>Hi <strong>${userData?.name || 'there'}</strong>,</p>
            <p>Your BridgeLang account is currently paused.</p>
            <p>Click the button below to reactivate it and continue:</p>
            <a href="${reactivateUrl}" style="display:inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reactivate My Account</a>
            <p style="margin-top: 20px; color: #64748b; font-size: 12px;">If you didn't request this, please contact support.</p>
          </div>
        `,
      });
    } catch (e) {
      console.error('send-login-code paused-account error:', e.message);
    }
    return res.json({ ok: true, paused: true });
  }

  // Generate OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  // --- Firestore write ---
  try {
    await adminDb.collection('loginCodes').doc(uid).set({ email, code, expiresAt });
  } catch (dbErr) {
    console.error('send-login-code Firestore write error:', dbErr.code, dbErr.message);
    return res.status(500).json({ error: 'server-config-error' });
  }

  // --- Email sending (SMTP check) ---
  try {
    await sendLoginCode({
      to: email,
      userName: userData?.name || '',
      code,
    });
  } catch (emailErr) {
    console.error('send-login-code email error:', emailErr.message);
    // Clean up the stored code since email wasn't delivered
    try { await adminDb.collection('loginCodes').doc(uid).delete(); } catch (_) {}
    return res.status(500).json({ error: 'email-send-failed' });
  }

  const isAdmin = userData?.role === 'admin';
  return res.json({ ok: true, paused: false, requiresCode: isAdmin || undefined });
}
