// tests/test-email.js
const { getTransport, sendMail } = require('../lib/mailer');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

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
