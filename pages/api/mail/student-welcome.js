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
    <p>Your free account is now active. To help you get the most value from it, here's the simple way most learners start.</p>

    <h3>Step 1: Explore tutors (free)</h3>
    <p>You can view up to 10 tutor profiles this month. Focus on:</p>
    <ul>
      <li>✔ Tutors who match your goal (work, daily life, interviews)</li>
      <li>✔ Teaching style and availability</li>
    </ul>

    <h3>Step 2: Send 1–2 short messages (free)</h3>
    <p>You have 3 free messages — most learners use them to explore and get a feel for the platform.</p>

    <h3>Step 3: Start with one lesson</h3>
    <p>Once you’ve found the right tutor:</p>
    <ul>
      <li>✔ Book one single lesson.</li>
      <li>✔ Pay only for that lesson.</li>
      <li>✔ Continue only if you’re happy - no subscription required.</li>
    </ul>

    <h3>📞 Contact Us Anytime</h3>
    <p>
      WhatsApp Business: +44 20 7111 1638 <br/>
      Email: contact@bridgelang.co.uk
    </p>

    <h3>Stay Connected!</h3>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 10px;">
    <tr>
        <td style="padding: 6px 0;">
        <a href="https://www.instagram.com/bridgelang_uk?igsh=a3U0czIyODJ1cDNy"
            style="display:inline-block;background:#E1306C;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-size:14px;">
            Instagram
        </a>
        </td>
    </tr>

    <tr>
        <td style="padding: 6px 0;">
        <a href="https://youtube.com/@bridgelang_uk?si=tA-V6RyZftqOvtRc"
            style="display:inline-block;background:#FF0000;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-size:14px;">
            YouTube
        </a>
        </td>
    </tr>

    <tr>
        <td style="padding: 6px 0;">
        <a href="https://www.facebook.com/share/17858srkmF/"
            style="display:inline-block;background:#1877F2;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-size:14px;">
            Facebook
        </a>
        </td>
    </tr>

    <tr>
        <td style="padding: 6px 0;">
        <a href="https://www.linkedin.com/company/bridgelang-uk/"
            style="display:inline-block;background:#0A66C2;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-size:14px;">
            LinkedIn
        </a>
        </td>
    </tr>

    <tr>
        <td style="padding: 6px 0;">
        <a href="https://whatsapp.com/channel/0029Vb6HgHt7DAWsU0NxoV3m"
            style="display:inline-block;background:#25D366;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-size:14px;">
            WhatsApp Channel
        </a>
        </td>
    </tr>
    </table>

    <p>Warm regards,<br/>Your BridgeLang Support Team</p>
  `;

  try {
    await sendMail({ to: email, subject, html });
    res.json({ ok: true });
  } catch (err) {
    console.error('welcome mail error:', err);
    res.status(500).json({ error: 'mail_fail' });
  }
}
