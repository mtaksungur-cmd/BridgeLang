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
      const rawToken = crypto.randomBytes(32).toString('hex');
      const unpauseHash = crypto
        .createHmac('sha256', process.env.UNPAUSE_TOKEN_SECRET)
        .update(rawToken)
        .digest('hex');
      const expiresAt = Date.now() + 48 * 60 * 60 * 1000;

      await adminDb.collection('users').doc(uid).update({
        unpauseHash,
        unpauseExpires: expiresAt,
      });

      const unpauseLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/account/unpause?token=${rawToken}`;

      // Use modern email (simple inline for paused accounts)
      const { sendMail } = require('../../../lib/mailer');
      await sendMail({
        to: email,
        subject: '🔓 Reactivate Your BridgeLang Account',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; background: #f3f4f6; }
              .card { background: white; margin: 24px 16px; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
              .header { background: #f59e0b; padding: 40px 24px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
              .content { padding: 32px 24px; }
              .button { display: inline-block; background: #2563eb; color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; }
              .footer { background: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <h1>🔓 Account Paused</h1>
                </div>
                <div class="content">
                  <p style="font-size: 17px;">Hi <strong>${userData?.name || 'there'}</strong>,</p>
                  <p style="color: #6b7280; margin: 16px 0;">Your BridgeLang account is currently paused.</p>
                  <p style="color: #6b7280; margin-bottom: 32px;">Click the button below to reactivate it and continue your learning journey:</p>
                  
                  <center>
                    <a href="${unpauseLink}" class="button">Reactivate My Account</a>
                  </center>

                  <p style="color: #9ca3af; font-size: 14px; margin-top: 32px; text-align: center;">
                    ⏱️ This link expires in <strong>48 hours</strong>
                  </p>
                </div>
                <div class="footer">
                  <p style="margin: 0;">BridgeLang · Your language learning partner</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log(`[send-login-code] Account paused → reactivation email sent to ${email}`);
      return res.json({ ok: true, paused: true });
    }

    // Active account - send 6 digit code with modern email
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    await adminDb.collection('loginCodes').doc(uid).set({
      email,
      code,
      expiresAt,
    });

    // Use modern email template
    await sendLoginCode({
      to: email,
      userName: userData?.name || '',
      code,
    });

    console.log(`[send-login-code] ✅ Modern OTP sent to ${email}`);
    return res.json({ ok: true, paused: false });
  } catch (err) {
    console.error('send-login-code error:', err);
    return res.status(500).json({ error: 'Failed to send code' });
  }
}
