import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer'; // ✅ mail fonksiyonunu ekledik

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { teacher } = req.body;
  if (!teacher?.id) return res.status(400).json({ error: 'Missing teacher ID' });

  try {
    // ✅ Firestore: Teacher'ı users koleksiyonuna taşı
    await adminDb.collection('users').doc(teacher.id).set(
      {
        ...teacher,
        role: 'teacher',
        status: 'approved',
        emailVerified: true,
      },
      { merge: true }
    );

    // ✅ PendingTeachers'tan sil
    await adminDb.collection('pendingTeachers').doc(teacher.id).delete();

    // ✅ Mail gönderimi
    await sendMail({
      to: teacher.email,
      subject: 'Your BridgeLang teacher application has been approved',
      html: `
        <p>Hi ${teacher.name || 'Teacher'},</p>
        <p>Congratulations! 🎉</p>
        <p>Your application to join <strong>BridgeLang UK Ltd.</strong> has been <strong>approved</strong>.</p>
        <p>You can now log in to your teacher dashboard using your registered email and start teaching.</p>
        <p>
          <a href="https://www.bridgelang.co.uk/login" 
             style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
             Go to Login
          </a>
        </p>
        <p>We’re excited to have you on board!<br/>— The BridgeLang Team</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('approveTeacher API error:', err);
    return res.status(500).json({ error: 'Approval failed' });
  }
}
