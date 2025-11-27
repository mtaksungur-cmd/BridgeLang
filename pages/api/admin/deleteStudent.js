import { adminDb, adminAuth } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { studentId, studentEmail, studentName } = req.body;
  if (!studentId) return res.status(400).json({ error: 'Missing studentId' });

  try {
    // Firestore'dan sil
    await adminDb.collection('users').doc(studentId).delete();

    // Auth'tan sil
    try {
      await adminAuth.deleteUser(studentId);
    } catch (e) {
      console.warn('auth delete failed', e.message);
    }

    // Mail bildirimi (opsiyonel)
    await sendMail({
      to: studentEmail,
      subject: 'Your BridgeLang account has been removed',
      html: `
        <p>Hi ${studentName || 'User'},</p>
        <p>Your account has been removed by the BridgeLang administration team.</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Delete failed' });
  }
}
