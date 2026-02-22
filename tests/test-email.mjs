// tests/test-email.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple env loader
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    let value = valueParts.join('=').trim();
    // Remove quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    process.env[key] = value.replace(/\\n/g, '\n');
  }
});

// NOW import the mailer
const { sendMail } = await import('../lib/mailer.js');

async function testEmail() {
  console.log('Testing Brevo SMTP with user:', process.env.SMTP_USER);
  try {
    const info = await sendMail({
      to: 'contact@bridgelang.co.uk',
      subject: 'Test Email from Bridgelang Automated Test',
      html: '<h1>SMTP Test</h1><p>This is a test email to verify Brevo SMTP configuration.</p>',
      text: 'This is a test email to verify Brevo SMTP configuration.'
    });
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    process.exit(1);
  }
}

testEmail();
