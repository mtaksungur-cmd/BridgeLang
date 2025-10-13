// pages/api/mail/teacher-application.js
import { sendMail } from '../../../lib/mailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { name, email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  try {
    await sendMail({
      to: email,
      subject: 'We’ve received your teacher application',
      html: `
        <p>Hi ${name || 'there'},</p>
        <p>Thank you for applying to teach on <strong>BridgeLang UK Ltd.</strong>.</p>
        <p>Your application has been received and will be reviewed by our team within <strong>2–3 business days</strong>.</p>
        <p>We’ll email you once your profile is approved or if additional information is needed.</p>
        <p>Best regards,<br/>BridgeLang Teacher Support Team</p>
      `,
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('teacher-application mail error:', e);
    res.status(500).json({ error: 'Failed to send mail' });
  }
}
