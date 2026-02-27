// pages/api/mail/student-welcome.js
import { sendMail } from '../../../lib/mailer';
import { getEmailSocialIconsHtml } from '../../../lib/emailSocialIcons';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, name } = req.body;
  if (!email || !name)
    return res.status(400).json({ error: 'Missing name or email' });

  const subject = "Welcome to BridgeLang — Let’s Start Your English Journey!";

  const html = `
    <p>Hi ${name},</p>
    <p>Welcome to <strong>BridgeLang</strong> 👋 - we’re really happy to have you with us!</p>
    <p>Your Free account is now active. To help you get the most value from it, here's the simple way most learners start:</p>

    <h3>Step 1: Explore tutors (Free)</h3>
    <p>You can view up to 10 tutor profiles. Focus on:</p>
    <ul>
      <li>✔ Tutors who match your goal (work, daily life, interviews)</li>
      <li>✔ Teaching style and availability</li>
    </ul>

    <h3>Step 2: Send 1–2 short messages (Free)</h3>
    <p>You have 3 Free messages — most learners use them to explore and get a feel for the platform.</p>

    <h3>Step 3: Start with one lesson</h3>
    <p>Once you’ve found the right tutor:</p>
    <ul>
      <li>✔ Book one single lesson.</li>
      <li>✔ Pay only for that lesson.</li>
      <li>✔ Continue only if you’re happy - no subscription required.</li>
    </ul>

    <h3>Feel free to reach out if you have any questions.</h3>
    <p>
      WhatsApp Business: +44 20 7111 1638 <br/>
      Email: contact@bridgelang.co.uk
    </p>

    <h3>Stay Connected!</h3>
    ${getEmailSocialIconsHtml('margin-top: 10px;')}

    <p>Warm regards,<br/>The BridgeLang Team</p>
  `;

  try {
    await sendMail({ to: email, subject, html });
    res.json({ ok: true });
  } catch (err) {
    console.error('welcome mail error:', err);
    res.status(500).json({ error: 'mail_fail' });
  }
}
