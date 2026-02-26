// lib/authEmails.js
import { sendMail } from './mailer';

export async function sendLoginCode({ to, userName, code }) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #f3f4f6; }
        .card { background: white; margin: 24px 16px; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: #2563eb; padding: 40px 24px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 32px 24px; text-align: center; }
        .code-box { background: #eff6ff; border: 2px dashed #2563eb; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .code { font-size: 42px; font-weight: 800; letter-spacing: 8px; color: #1e40af; font-family: 'Courier New', monospace; text-align: center; }
        .footer { background: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <h1>🔐 Login Verification</h1>
          </div>
          <div class="content">
            <p style="font-size: 17px; color: #374151; margin-bottom: 8px;">Hi <strong>${userName || 'there'}</strong>,</p>
            <p style="color: #6b7280; margin-bottom: 32px;">Your verification code is ready. Enter it to continue:</p>
            
            <div class="code-box">
              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Your Code</p>
              <div class="code">${code}</div>
            </div>

            <p style="color: #9ca3af; font-size: 14px; margin-top: 32px;">
              ⏱️ This code expires in <strong>10 minutes</strong>
            </p>
            <p style="color: #9ca3af; font-size: 13px; margin-top: 16px;">
              Didn't request this? You can safely ignore this email.
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0 0 8px 0; font-weight: 500; color: #374151;">BridgeLang</p>
            <p style="margin: 0;">Secure login · Learn with confidence</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await sendMail({
      to,
      subject: '🔐 Your BridgeLang Login Code',
      html: htmlContent,
    });
    console.log('[authEmails] ✅ Login code sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('[authEmails] ❌ ERROR sending login code:', error.message);
    throw error;
  }
}

export async function sendPasswordReset({ to, userName, resetLink }) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #f3f4f6; }
        .card { background: white; margin: 24px 16px; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: #8b5cf6; padding: 40px 24px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 32px 24px; }
        .button { display: inline-block; background: #8b5cf6; color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
        .footer { background: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
        .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <h1>🔑 Reset Your Password</h1>
          </div>
          <div class="content">
            <p style="font-size: 17px;">Hi <strong>${userName || 'there'}</strong>,</p>
            <p style="color: #6b7280; margin: 16px 0;">We received a request to reset your password. Click the button below to create a new password:</p>
            
            <center>
              <a href="${resetLink}" class="button" style="background:#8b5cf6;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;">Reset My Password</a>
            </center>

            <div class="info-box">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email.
              </p>
            </div>

            <p style="color: #9ca3af; font-size: 13px; text-align: center; margin-top: 24px;">
              Button not working? Copy and paste this link:<br>
              <code style="background: #f3f4f6; padding: 8px; display: inline-block; margin-top: 8px; border-radius: 4px; font-size: 12px; word-break: break-all;">${resetLink}</code>
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0 0 8px 0; font-weight: 500; color: #374151;">BridgeLang</p>
            <p style="margin: 0;">Keeping your account secure</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await sendMail({
      to,
      subject: '🔑 Reset Your BridgeLang Password',
      html: htmlContent,
    });
    console.log('[authEmails] ✅ Password reset sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('[authEmails] ❌ ERROR sending password reset:', error.message);
    throw error;
  }
}

export async function sendWelcomeEmail({ to, userName }) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #f3f4f6; }
        .card { background: white; margin: 24px 16px; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 24px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 32px; font-weight: 700; }
        .content { padding: 32px 24px; }
        .button { display: inline-block; background: #10b981; color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
        .footer { background: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
        .feature { background: #f9fafb; padding: 16px; border-radius: 8px; margin: 12px 0; border-left: 3px solid #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <h1>🎉 Welcome to BridgeLang!</h1>
          </div>
          <div class="content">
            <p style="font-size: 20px; margin-bottom: 8px;">Hi <strong>${userName || 'there'}</strong>,</p>
            <p style="color: #6b7280; margin: 16px 0; font-size: 16px;">We're thrilled to have you join our community of language learners! 🌍</p>
            
            <h3 style="color: #059669; margin-top: 32px;">What's next?</h3>
            
            <div class="feature">
              <strong style="color: #047857;">👨‍🏫 Find Your Perfect Teacher</strong>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Browse hundreds of qualified teachers and book your first lesson</p>
            </div>

            <div class="feature">
              <strong style="color: #047857;">📅 Book Lessons</strong>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Choose a time that works for you and start learning immediately</p>
            </div>

            <div class="feature">
              <strong style="color: #047857;">💬 Message Teachers</strong>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Chat directly with teachers before booking to find the perfect match</p>
            </div>

            <center>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/student/teachers" class="button" style="background:#10b981;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;">Start Learning Now</a>
            </center>

            <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 32px;">
              Need help? Our support team is here for you 24/7
            </p>

            <h3 style="color: #059669; margin-top: 32px; text-align: center;">Stay Connected!</h3>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 10px auto;">
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
          </div>
          <div class="footer">
            <p style="margin: 0 0 8px 0; font-weight: 500; color: #374151;">BridgeLang</p>
            <p style="margin: 0;">Your journey to fluency starts here</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await sendMail({
      to,
      subject: '🎉 Welcome to BridgeLang - Let\'s Get Started!',
      html: htmlContent,
    });
    console.log('[authEmails] ✅ Welcome email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('[authEmails] ❌ ERROR sending welcome email:', error.message);
    throw error;
  }
}
