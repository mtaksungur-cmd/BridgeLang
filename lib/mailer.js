// lib/mailer.js
import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER; // ör: 94a700001@smtp-brevo.com
const pass = process.env.SMTP_PASS;
const from = process.env.MAIL_FROM || 'BridgeLang <no-reply@bridgelang.com>';

if (!user || !pass) {
  console.warn('[mailer] SMTP creds missing. Check env.');
}

export function getTransport() {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,              // 587 için false
    auth: { user, pass },
    tls: { rejectUnauthorized: false }, // local dev’de el sıkışma sorunlarını azaltır
  });
  return transporter;
}

/**
 * sendMail({to, subject, html, text})
 */
export async function sendMail({ to, subject, html, text }) {
  const transporter = getTransport();

  // 🔹 Sabit şirket footeri (tüm maillerde)
  const companyFooter = `
    <hr style="margin:20px 0;border:none;border-top:1px solid #ddd;">
    <p style="font:13px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial;color:#444">
      <strong>BridgeLang UK Ltd.</strong><br>
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
    html: html ? `${html}${companyFooter}` : companyFooter, // 🔹 footer eklendi
  };

  const info = await transporter.sendMail(payload);
  console.log('[mailer] messageId:', info.messageId);
  console.log('[mailer] accepted:', info.accepted);
  console.log('[mailer] rejected:', info.rejected);

  if (info.rejected && info.rejected.length) {
    throw new Error(`SMTP rejected: ${info.rejected.join(', ')}`);
  }

  return info;
}

/**
 * Build the 1-hour reminder email (EN)
 */
export function buildReminderEmail({
  who,                // 'student' | 'teacher'
  teacherName,
  studentName,
  date,               // 'yyyy-MM-dd'
  startTime,          // 'HH:mm'
  endTime,            // 'HH:mm' (opsiyonel)
  duration,           // dakika (opsiyonel, endTime yoksa hesap için)
  location,           // 'Online' | 'Teacher\'s Home' | ...
  meetingLink,        // opsiyonel
  timezone            // 'Europe/Istanbul' gibi (opsiyonel, biliniyorsa gösterir)
}) {
  const recName   = who === 'student' ? (studentName || 'Student') : (teacherName || 'Teacher');
  const safe      = (v, def='—') => (v && String(v).trim()) || def;

  // endTime verilmemişse duration ile hesapla (basit hesap)
  let computedEnd = endTime;
  if (!computedEnd && startTime && Number.isFinite(Number(duration))) {
    const [h, m] = startTime.split(':').map(n => parseInt(n, 10));
    const total  = h * 60 + m + Number(duration);
    const hh     = String(Math.floor(total / 60) % 24).padStart(2,'0');
    const mm     = String(total % 60).padStart(2,'0');
    computedEnd  = `${hh}:${mm}`;
  }

  const showJoin = location === 'Online' && meetingLink;
  const subject  = `⏰ Class reminder — ${safe(date)} ${safe(startTime)} (${who === 'student' ? 'with' : 'with'} ${who === 'student' ? safe(teacherName,'Teacher') : safe(studentName,'Student')})`;

  const textLines = [
    `Hi ${recName},`,
    ``,
    `This is a friendly reminder that your class starts in about 1 hour.`,
    ``,
    `Details:`,
    `- Teacher: ${safe(teacherName, 'Teacher')}`,
    `- Student: ${safe(studentName, 'Student')}`,
    `- Date: ${safe(date)}`,
    `- Start: ${safe(startTime)}${timezone ? ` (${timezone})` : ''}`,
    `- End: ${safe(computedEnd)}`,
    `- Duration: ${duration ? `${duration} minutes` : (computedEnd ? '' : '—')}`,
    `- Location: ${safe(location)}`,
    showJoin ? `- Join link: ${meetingLink}` : '',
    ``,
    `Have a great lesson!`,
    `BridgeLang`,
  ].filter(Boolean);

  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
    <h2 style="margin:0 0 8px">Your class starts in <span style="white-space:nowrap">~1 hour</span></h2>
    <p style="margin:0 0 12px">Hi <strong>${recName}</strong>,</p>

    <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
      <tr><td style="padding:4px 0"><strong>Teacher:</strong></td><td style="padding:4px 8px">${safe(teacherName,'Teacher')}</td></tr>
      <tr><td style="padding:4px 0"><strong>Student:</strong></td><td style="padding:4px 8px">${safe(studentName,'Student')}</td></tr>
      <tr><td style="padding:4px 0"><strong>Date:</strong></td><td style="padding:4px 8px">${safe(date)}</td></tr>
      <tr><td style="padding:4px 0"><strong>Start:</strong></td><td style="padding:4px 8px">${safe(startTime)}${timezone ? ` (${timezone})` : ''}</td></tr>
      <tr><td style="padding:4px 0"><strong>End:</strong></td><td style="padding:4px 8px">${safe(computedEnd)}</td></tr>
      ${duration ? `<tr><td style="padding:4px 0"><strong>Duration:</strong></td><td style="padding:4px 8px">${duration} minutes</td></tr>` : ``}
      <tr><td style="padding:4px 0"><strong>Location:</strong></td><td style="padding:4px 8px">${safe(location)}</td></tr>
      ${showJoin ? `<tr><td style="padding:8px 0" colspan="2">
        <a href="${meetingLink}"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px"
           target="_blank" rel="noopener">Join Online Class</a>
        <div style="font-size:12px;color:#555;margin-top:6px">${meetingLink}</div>
      </td></tr>` : ``}
    </table>

    <p style="margin:16px 0 0">Have a great lesson!<br/>— BridgeLang</p>
  </div>
  `;

  return { subject, text: textLines.join('\n'), html };
}

export function buildParentalConsentEmail({ studentName, parentName, parentEmail, confirmUrl }) {
  const subject = '⚠️ Action Required: Confirm Parental Consent for BridgeLang Registration';
  const html = `
    <p>Dear ${parentName || 'Parent/Guardian'},</p>
    <p>Your child, <b>${studentName}</b>, has registered for a BridgeLang account. Since they are under 18, we require your explicit consent before their account can be activated.</p>
    <p>Please review our <a href="${process.env.NEXT_PUBLIC_BASE_URL}/terms">Terms of Use</a> and <a href="${process.env.NEXT_PUBLIC_BASE_URL}/privacy">Privacy Policy</a> before confirming.</p>
    <p><a href="${confirmUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">✅ Confirm Consent</a></p>
    <p>Without your confirmation, your child will not be able to access our services.</p>
    <p>Thank you,<br/>BridgeLang Support Team</p>
  `;
  return { subject, html, text: '' };
}
