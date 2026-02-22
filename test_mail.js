// test_mail.js
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length > 0) {
    let val = value.join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    process.env[key.trim()] = val.replace(/\\n/g, '\n');
  }
});

const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.MAIL_FROM || 'BridgeLang <contact@bridgelang.co.uk>';

async function sendTestMail() {
  console.log(`Connecting to ${host}:${port} with user ${user}...`);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified.');

    const info = await transporter.sendMail({
      from,
      to: 'contact@bridgelang.co.uk',
      subject: 'SMTP Test - Bridgelang Phase 1',
      text: 'This is a test email to verify Brevo SMTP credentials.',
      html: '<p>This is a <b>test email</b> to verify Brevo SMTP credentials.</p>',
    });

    console.log('✅ Test email sent successfully. Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP Error:', error);
    process.exit(1);
  }
}

sendTestMail();
