// pages/api/mail/admin-new-teacher.js
import { sendMail } from '../../../lib/mailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, specialty } = req.body;
  if (!name || !email)
    return res.status(400).json({ error: 'Missing data' });

  const subject = `🔔 New Teacher Application — ${name}`;

  const html = `
    <p>Admin,</p>
    <p>A new teacher has applied to join BridgeLang.</p>
    <ul>
      <li><strong>Name:</strong> ${name}</li>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Specialties:</strong> ${specialty || 'Not specified'}</li>
    </ul>
    <p>Please review the application in the <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://bridgelang.co.uk'}/admin/teachers">Admin Panel</a>.</p>
  `;

  try {
    await sendMail({
      to: 'contact@bridgelang.co.uk',
      subject,
      html
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('admin-new-teacher notify error:', err);
    res.status(500).json({ error: 'mail_fail' });
  }
}
