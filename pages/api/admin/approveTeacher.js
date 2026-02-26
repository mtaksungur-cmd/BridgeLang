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

      <h3>Stay Connected!</h3>

      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 10px;">
      <tr>
          <td style="padding: 0 8px 0 0;">
            <a href="https://www.instagram.com/bridgelang_uk?igsh=a3U0czIyODJ1cDNy" target="_blank" style="text-decoration:none;">
              <img src="https://img.icons8.com/fluency/48/instagram-new.png" alt="Instagram" width="36" height="36" style="display:block; border:0; border-radius:8px;" />
            </a>
          </td>
          <td style="padding: 0 8px 0 0;">
            <a href="https://youtube.com/@bridgelang_uk?si=tA-V6RyZftqOvtRc" target="_blank" style="text-decoration:none;">
              <img src="https://img.icons8.com/fluency/48/youtube-play.png" alt="YouTube" width="36" height="36" style="display:block; border:0; border-radius:8px;" />
            </a>
          </td>
          <td style="padding: 0 8px 0 0;">
            <a href="https://www.facebook.com/share/17858srkmF/" target="_blank" style="text-decoration:none;">
              <img src="https://img.icons8.com/fluency/48/facebook-new.png" alt="Facebook" width="36" height="36" style="display:block; border:0; border-radius:8px;" />
            </a>
          </td>
          <td style="padding: 0 8px 0 0;">
            <a href="https://www.linkedin.com/company/bridgelang-uk/" target="_blank" style="text-decoration:none;">
              <img src="https://img.icons8.com/fluency/48/linkedin.png" alt="LinkedIn" width="36" height="36" style="display:block; border:0; border-radius:8px;" />
            </a>
          </td>
      </tr>
      </table>

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
