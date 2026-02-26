// pages/api/mail/teacher-welcome.js
import { sendMail } from '../../../lib/mailer';

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

  try {
    await sendMail({ to: email, subject, html });
    res.json({ ok: true });
  } catch (err) {
    console.error('teacher welcome mail error:', err);
    res.status(500).json({ error: 'mail_fail' });
  }
}
