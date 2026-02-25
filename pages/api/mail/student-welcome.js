// pages/api/mail/student-welcome.js
import { sendMail } from '../../../lib/mailer';

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

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 10px;">
    <tr>
        <td style="padding: 10px 10px 10px 0;">
          <a href="https://www.instagram.com/bridgelang_uk?igsh=a3U0czIyODJ1cDNy" target="_blank">
            <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg" alt="Instagram" width="28" height="28" style="display:block; border:0; background:#E4405F; padding:4px; border-radius:6px;" />
          </a>
        </td>
        <td style="padding: 10px 10px 10px 0;">
          <a href="https://youtube.com/@bridgelang_uk?si=tA-V6RyZftqOvtRc" target="_blank">
            <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg" alt="YouTube" width="28" height="28" style="display:block; border:0; background:#FF0000; padding:4px; border-radius:6px;" />
          </a>
        </td>
        <td style="padding: 10px 10px 10px 0;">
          <a href="https://www.facebook.com/share/17858srkmF/" target="_blank">
            <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg" alt="Facebook" width="28" height="28" style="display:block; border:0; background:#1877F2; padding:4px; border-radius:6px;" />
          </a>
        </td>
        <td style="padding: 10px 10px 10px 0;">
          <a href="https://www.linkedin.com/company/bridgelang-uk/" target="_blank">
            <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg" alt="LinkedIn" width="28" height="28" style="display:block; border:0; background:#0A66C2; padding:4px; border-radius:6px;" />
          </a>
        </td>
    </tr>
    </table>

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
