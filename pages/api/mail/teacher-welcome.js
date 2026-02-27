// pages/api/mail/teacher-welcome.js
import { sendMail } from '../../../lib/mailer';
import { getEmailSocialIconsHtml } from '../../../lib/emailSocialIcons';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, name } = req.body;
  if (!email || !name)
    return res.status(400).json({ error: 'Missing name or email' });

  const subject = "Welcome to BridgeLang — Your Profile Is Now Live! 🎉";

  const html = `
    <p>Hi ${name},</p>
    <p>Great news — your BridgeLang teacher profile has been approved and is now live! 🎉</p>
    <p>We're excited to welcome you to our growing community of UK-based tutors.</p>

    <h3>⭐ Getting Started</h3>
    <ul>
      <li>✔ Complete your profile with a photo and bio</li>
      <li>✔ Set your availability so students can find you</li>
      <li>✔ Connect your Stripe account to receive payments</li>
      <li>✔ Reply to student messages quickly to build your reputation</li>
    </ul>

    <h3>💰 How Earnings Work</h3>
    <ul>
      <li>You keep 80% of every lesson fee</li>
      <li>Payments are transferred after both parties confirm the lesson</li>
      <li>No minimum hours or quotas — teach on your own schedule</li>
    </ul>

    <h3>Need Help?</h3>
    <p>
      Email: contact@bridgelang.co.uk <br/>
      WhatsApp Business: +44 20 7111 1638
    </p>

    <h3>Stay Connected!</h3>
    ${getEmailSocialIconsHtml('margin-top: 10px;')}

    <p>Warm regards,<br/>The BridgeLang Team</p>
  `;

  try {
    await sendMail({ to: email, subject, html });
    res.json({ ok: true });
  } catch (err) {
    console.error('teacher welcome mail error:', err);
    res.status(500).json({ error: 'mail_fail' });
  }
}
