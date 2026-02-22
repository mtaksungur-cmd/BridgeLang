// lib/mailer.js
import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.MAIL_FROM || 'BridgeLang <contact@bridgelang.co.uk>';

export function getTransport() {
  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

export async function sendMail({ to, subject, html, text }) {
  const transporter = getTransport();

  const companyFooter = `
    <hr style="margin:20px 0;border:none;border-top:1px solid #ddd;">
    <p style="font:13px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial;color:#444">
      <strong>BridgeLang Ltd.</strong><br>
      Company Number: 16555217<br>
      Registered Address: The Apex, Derriford Business Park, Brest Road, Plymouth, PL6 5FL, United Kingdom<br>
      📧 contact@bridgelang.co.uk &nbsp;|&nbsp; 📞 +44 20 7111 1638
    </p>
  `;

  const payload = {
    from,
    to,
    subject,
    text: text || '',
    html: html ? `${html}${companyFooter}` : companyFooter,
  };

  const info = await transporter.sendMail(payload);
  console.log('[mailer] ✅ Sent messageId:', info.messageId);
  return info;
}
