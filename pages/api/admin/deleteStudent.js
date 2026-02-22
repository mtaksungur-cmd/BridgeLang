import { adminDb, adminAuth } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { studentId, studentEmail, studentName } = req.body;
  if (!studentId) return res.status(400).json({ error: 'Missing studentId' });

  try {
    // Silinen e-postayı kaydet (tekrar kayıt engeli)
    if (studentEmail) {
      const emailHash = crypto.createHash('sha256').update(studentEmail.trim().toLowerCase()).digest('hex');
      await adminDb.collection('deletedEmails').doc(emailHash).set({
        email: studentEmail.trim().toLowerCase(),
        deletedAt: Date.now(),
      });
    }

    // Firestore'dan sil
    await adminDb.collection('users').doc(studentId).delete();

    // Auth'tan sil
    try {
      await adminAuth.deleteUser(studentId);
    } catch (e) {
      console.warn('auth delete failed', e.message);
    }

    // Mail bildirimi (opsiyonel)
    try {
      await sendMail({
        to: studentEmail,
        subject: 'Your BridgeLang account has been removed',
        html: `
          <p>Hi ${studentName || 'User'},</p>
          <p>Your account has been removed by the BridgeLang administration team.</p>
        `,
      });
    } catch (mailError) {
      console.warn('Mail notification failed after deletion:', mailError.message);
      // Don't fail the whole request just because the email couldn't send
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Delete failed' });
  }
}
