// pages/api/mail/student-welcome.js
import { sendMail } from '../../../lib/mailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, name } = req.body;
  if (!email || !name)
    return res.status(400).json({ error: 'Missing name or email' });

  const subject = Welcome to BridgeLang — Let’s Start Your English Journey!;

  const html = `
    <p>Hi ${name},</p>
    <p>Welcome to <strong>BridgeLang</strong> 👋 — we’re really happy to have you with us!</p>
    <p>Your free account is now active. To help you get the most value from it, here&apos;s the simple way most learners start.</p>

    <h3>🌟 What You Can Do Right Away (Free Plan Included!)</h3>
    <p>With your free plan, you can already start exploring:</p>
    <ul>
      <li>✔ View a limited number of teacher profiles every month</li>
      <li>✔ Send a limited number of messages</li>
      <li>✔ Choose any UK-based teacher you like</li>
      <li>✔ Book your first lesson whenever you’re ready</li>
      <li>✔ Upgrade anytime for more views, more messages & exclusive discounts</li>
    </ul>

    <h3>Want Cheaper Lesson Costs Later?</h3>
    <p>If you upgrade to a paid plan anytime, you’ll unlock:</p>
    <ul>
      <li>10–20% discounts on your first 6 lessons</li>
      <li>Review-based bonus coupons</li>
      <li>Loyalty coupons every 3 months</li>
      <li>Long-term price reductions (VIP plan)</li>
    </ul>

    <h3>💬 Need Help Choosing a Teacher?</h3>
    <p>We can help match you with the right tutor based on your goals.</p>

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
