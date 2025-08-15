// lib/mailer.js
import nodemailer from 'nodemailer';

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,       // ör: smtp-relay.brevo.com
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,                     // 465 ise true
  auth: {
    user: process.env.SMTP_USER,     // Brevo: SMTP key'in user kısmı
    pass: process.env.SMTP_PASS
  }
});

export async function sendLessonReminder({ to, name, role, startISO, meetingLink }) {
  const subject = 'Your lesson starts in 1 hour ⏰';
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif">
      <h2>Hi ${name || ''}${name ? ',' : ''}</h2>
      <p>This is a reminder that your <b>${role}</b> lesson will start in <b>~1 hour</b>.</p>
      <p><b>Start time:</b> ${new Date(startISO).toLocaleString()}</p>
      ${meetingLink ? `<p><b>Meeting link:</b> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
      <p>Have a great lesson!<br/>BridgeLang</p>
    </div>
  `;
  await mailer.sendMail({
    from: process.env.MAIL_FROM || 'BridgeLang <no-reply@bridgelang.com>',
    to,
    subject,
    html,
  });
}
