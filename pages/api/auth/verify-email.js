// pages/api/auth/verify-email.js
import { adminAuth, adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  const { oobCode } = req.query;
  if (!oobCode) return res.status(400).send('Invalid verification link.');

  try {
    const info = await adminAuth.checkActionCode(oobCode);
    const email = info.data.email;
    await adminAuth.applyActionCode(oobCode);

    // Firestore kullanıcı belgesi güncelle
    const users = await adminDb.collection('users').where('email', '==', email).get();
    if (!users.empty) {
      await adminDb.collection('users').doc(users.docs[0].id).update({
        emailVerified: true,
        verifiedAt: Date.now(),
      });
    }

    res.send(`
      <html>
        <head><title>Email Verified</title></head>
        <body style="font-family:Arial;text-align:center;margin-top:100px;">
          <h2>Your email has been verified ✅</h2>
          <p>You can now log in to your account.</p>
          <a href="/login" style="color:white;background:#2563eb;padding:10px 16px;border-radius:8px;text-decoration:none;">Go to Login</a>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('verify-email error:', err);
    res.status(400).send('Invalid or expired verification link.');
  }
}
