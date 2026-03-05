// pages/api/mail/admin-new-student.js
import { sendMail } from '../../../lib/mailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email } = req.body;
  if (!name || !email)
    return res.status(400).json({ error: 'Missing data' });

  const subject = `🔔 New Student Registered — ${name}`;

  const html = `
    <p>Admin,</p>
    <p>A new student has registered on BridgeLang.</p>
    <ul>
      <li><strong>Name:</strong> ${name}</li>
      <li><strong>Email:</strong> ${email}</li>
    </ul>
    <p>Please review the user in the admin dashboard.</p>
  `;

  try {
    await sendMail({
      to: 'mtaksungur@gmail.com',
      subject,
      html
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('admin notify error:', err);
    res.status(500).json({ error: 'mail_fail' });
  }
}
