import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer'; // ✅ mail fonksiyonunu ekledik

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { teacherId, teacherEmail, teacherName, reason } = req.body;
  if (!teacherId || !teacherEmail)
    return res.status(400).json({ error: 'Missing teacher ID or email' });

  try {
    // ✅ PendingTeachers'tan sil
    await adminDb.collection('pendingTeachers').doc(teacherId).delete();

    try {
      await adminAuth.deleteUser(teacherId);
      console.log(`🗑️ Auth user deleted: ${teacherId}`);
    } catch (authErr) {
      console.warn('⚠️ Auth deletion failed:', authErr.message);
    }
    
    // ✅ Mail gönderimi
    await sendMail({
      to: teacherEmail,
      subject: 'Your BridgeLang teacher application was not approved',
      html: `
        <p>Hi ${teacherName || 'Teacher'},</p>
        <p>Thank you for your interest in teaching with <strong>BridgeLang UK Ltd.</strong>.</p>
        <p>After reviewing your application, we’re unable to proceed at this time.</p>
        ${
          reason
            ? `<p><strong>Reason:</strong> ${reason}</p>`
            : ''
        }
        <p>You may reapply in the future once you’ve updated your qualifications or experience.</p>
        <p>Kind regards,<br/>BridgeLang Review Team</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('rejectTeacher API error:', err);
    return res.status(500).json({ error: 'Rejection failed' });
  }
}
