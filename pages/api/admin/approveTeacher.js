// pages/api/admin/approveTeacher.js
import { adminDb, adminAuth } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { teacher } = req.body;
  if (!teacher?.id) return res.status(400).json({ error: 'Missing teacher ID' });

  try {
    const ref = adminDb.collection('pendingTeachers').doc(teacher.id);
    const snap = await ref.get();
    const pending = snap.exists ? snap.data() : {};
    const now = new Date();

    const data = {
      ...pending,
      ...teacher,
      role: 'teacher',
      status: 'approved',
      emailVerified: true,
      createdAt: pending.createdAt || teacher.createdAt || now,
      approvedAt: now,
      emailNotifications: true,
    };

    await adminDb.collection('users').doc(teacher.id).set(data, { merge: true });

    await ref.delete();

    const subject = `Your BridgeLang Profile Is Now Live! 🎉`;

    const html = `
      <p>Hi ${teacher.name || 'Teacher'},</p>
      <p>Great news — your BridgeLang teacher profile has been approved and is now live on our platform! 🎉</p>
      <p>We're excited to welcome you to our growing community of UK-based tutors.</p>

      <h3>⭐ What This Means for You</h3>
      <p>You can now start connecting with learners who are looking for UK tutors just like you.</p>

      <ul>
        <li>Full flexibility — teach online or in person</li>
        <li>Set your own rates</li>
        <li>Keep 80% of your earnings</li>
        <li>No minimum hours or quotas</li>
        <li>Support whenever you need it</li>
      </ul>

      <h3>Keeping Your Profile Strong</h3>
      <p>To help attract more students:</p>
      <ul>
        <li>Keep your photo & bio friendly and updated</li>
        <li>Reply to student messages quickly</li>
      </ul>

      <h3>Need Help?</h3>
      <p>
        Email: contact@bridgelang.co.uk <br/>
        WhatsApp Business: +44 20 7111 1638
      </p>

      <p>Warm regards,<br/>The BridgeLang Team</p>
    `;

    await sendMail({
      to: data.email,
      subject,
      html
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('approveTeacher error:', err);
    res.status(500).json({ error: 'Approval failed' });
  }
}
