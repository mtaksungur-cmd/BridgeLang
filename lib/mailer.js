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

/**
 * Build a reminder email for student or teacher
 */
export function buildReminderEmail({ who, teacherName, studentName, date, startTime, endTime, duration, location, meetingLink, timezone }) {
  const isStudent = who === 'student';
  const recipientName = isStudent ? studentName : teacherName;
  const otherName = isStudent ? teacherName : studentName;
  const role = isStudent ? 'teacher' : 'student';

  const timeStr = endTime ? `${startTime} – ${endTime}` : startTime;
  const tzLabel = timezone || 'Europe/London';

  const subject = `⏰ Lesson Reminder: ${date} at ${startTime}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;background:#f3f4f6;margin:0;padding:0;">
      <div style="max-width:600px;margin:0 auto;background:#f3f4f6;">
        <div style="background:white;margin:24px 16px;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <div style="background:#f59e0b;padding:32px 24px;text-align:center;color:white;">
            <h1 style="margin:0;font-size:22px;">⏰ Lesson Reminder</h1>
          </div>
          <div style="padding:32px 24px;">
            <p style="font-size:17px;">Hi <strong>${recipientName}</strong>,</p>
            <p style="font-size:16px;color:#4b5563;">Your lesson with your ${role} <strong>${otherName}</strong> is coming up!</p>
            <div style="background:#f9fafb;padding:20px;border-radius:8px;border-left:4px solid #f59e0b;margin:20px 0;">
              <p style="margin:4px 0;"><strong>📅 Date:</strong> ${date}</p>
              <p style="margin:4px 0;"><strong>⏰ Time:</strong> ${timeStr} (${tzLabel})</p>
              ${duration ? `<p style="margin:4px 0;"><strong>⏱️ Duration:</strong> ${duration} min</p>` : ''}
              <p style="margin:4px 0;"><strong>📍 Location:</strong> ${location || '—'}</p>
            </div>
            ${meetingLink ? `<div style="text-align:center;margin:20px 0;"><a href="${meetingLink}" style="display:inline-block;background:#10b981;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;">Join Lesson</a></div>` : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export async function sendMail({ to, subject, html, text }) {
  if (!user || !pass) {
    throw new Error('SMTP is not configured. Add SMTP_USER and SMTP_PASS to .env.local (see BREVO_SETUP.md).');
  }
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
