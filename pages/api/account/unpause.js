import { adminDb } from '../../../lib/firebaseAdmin';
import crypto from 'crypto';

export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).send('Invalid token.');

  try {
    const unpauseHash = crypto
      .createHmac('sha256', process.env.UNPAUSE_TOKEN_SECRET)
      .update(token)
      .digest('hex');

    const users = await adminDb
      .collection('users')
      .where('unpauseHash', '==', unpauseHash)
      .limit(1)
      .get();

    if (users.empty) return res.status(400).send('Invalid or expired token.');

    const docRef = users.docs[0].ref;
    const data = users.docs[0].data();

    if (Date.now() > (data.unpauseExpires || 0)) {
      return res.status(400).send('Token expired.');
    }

    await docRef.update({
      status: 'active',
      unpauseHash: null,
      unpauseExpires: null,
    });

    return res.send(`
      <html>
        <body style="font-family:sans-serif;text-align:center;margin-top:100px;">
          <h2>Your BridgeLang account has been reactivated ✅</h2>
          <a href="/login" style="background:#2563eb;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;">Go to Login</a>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('unpause error:', err);
    res.status(500).send('Server error.');
  }
}
