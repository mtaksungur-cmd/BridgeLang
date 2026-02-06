import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Vibrant, professional email template - solid colors, no gradients
const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; background: #f3f4f6; }
  .card { background: white; margin: 24px 16px; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .header { background: #10b981; padding: 40px 24px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
  .content { padding: 32px 24px; }
  .info-card { background: #f9fafb; border-left: 4px solid #10b981; padding: 20px; border-radius: 6px; margin: 24px 0; }
  .info-card h3 { margin: 0 0 12px 0; color: #059669; font-size: 16px; font-weight: 600; }
  .details-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
  .details-row:last-child { border-bottom: none; }
  .details-label { font-weight: 500; color: #6b7280; }
  .details-value { font-weight: 600; color: #111827; text-align: right; }
  .button { display: inline-block; background: #2563eb; color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 24px 0; box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2); }
  .footer { background: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
  .badge { background: #10b981; color: white; padding: 6px 14px; border-radius: 6px; font-weight: 700; display: inline-block; }
  .tip-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; border-radius: 6px; margin: 20px 0; }
  .tip-box p { margin: 0; color: #1e40af; font-size: 15px; }
`;

export async function sendBookingConfirmation({ to, userName, teacherName, lessonDate, lessonTime, duration, location, price, bookingId }) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <h1>✓ Lesson Confirmed</h1>
          </div>
          <div class="content">
            <p style="font-size: 17px; margin-bottom: 8px;">Hi <strong>${userName}</strong>,</p>
            <p style="color: #4b5563; margin-bottom: 24px; font-size: 15px;">
              Great news! Your lesson is all set. Here's everything you need to know:
            </p>
            
            <div class="info-card">
              <h3>📚 Lesson Details</h3>
              <div class="details-row">
                <span class="details-label">Teacher</span>
                <span class="details-value">${teacherName}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Date</span>
                <span class="details-value">${lessonDate}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Time</span>
                <span class="details-value">${lessonTime}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Duration</span>
                <span class="details-value">${duration} minutes</span>
              </div>
              <div class="details-row">
                <span class="details-label">Location</span>
                <span class="details-value">${location}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Amount Paid</span>
                <span class="details-value"><span class="badge">£${price}</span></span>
              </div>
            </div>
            
            <div class="tip-box">
              <p><strong>💡 Pro Tip:</strong> Join a few minutes early to test your connection and say hello!</p>
            </div>
            
            <p style="color: #9ca3af; font-size: 13px; margin: 20px 0;">
              Booking ID: <code style="background: #f3f4f6; padding: 3px 8px; border-radius: 4px; font-family: monospace;">${bookingId}</code>
            </p>
            
            <center>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/student/lessons" class="button">View My Lessons</a>
            </center>
          </div>
          <div class="footer">
            <p style="margin: 0 0 8px 0; font-weight: 500; color: #374151;">BridgeLang</p>
            <p style="margin: 0; font-size: 13px;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}" style="color: #2563eb; text-decoration: none;">Home</a> · 
              <a href="mailto:support@bridgelang.co.uk" style="color: #2563eb; text-decoration: none;">Support</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.MAIL_FROM,
    to,
    subject: `✓ Lesson confirmed with ${teacherName}`,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Booking confirmation sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Booking email error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendSubscriptionConfirmation({ to, userName, planName, price, benefits, nextRenewalDate }) {
  const benefitsList = benefits.map(b => `
    <div style="display: flex; align-items: center; margin: 10px 0;">
      <span style="color: #10b981; font-size: 18px; margin-right: 10px;">✓</span>
      <span style="color: #374151; font-size: 15px;">${b}</span>
    </div>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header" style="background: #3b82f6;">
            <h1>🚀 Welcome to ${planName}</h1>
          </div>
          <div class="content">
            <p style="font-size: 17px; margin-bottom: 8px;">Hi <strong>${userName}</strong>,</p>
            <p style="color: #4b5563; margin-bottom: 24px; font-size: 15px;">
              Thanks for upgrading! Your <strong>${planName}</strong> plan is now active and ready to use.
            </p>
            
            <div class="info-card" style="border-left-color: #3b82f6;">
              <h3 style="color: #1e40af;">💎 Subscription Summary</h3>
              <div class="details-row">
                <span class="details-label">Plan</span>
                <span class="details-value">${planName}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Amount Paid</span>
                <span class="details-value"><span class="badge" style="background: #3b82f6;">£${price}</span></span>
              </div>
              <div class="details-row">
                <span class="details-label">Next Renewal</span>
                <span class="details-value">${nextRenewalDate}</span>
              </div>
            </div>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h4 style="margin: 0 0 16px 0; color: #166534; font-size: 16px;">Your Benefits:</h4>
              ${benefitsList}
            </div>
            
            <center>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/student/dashboard" class="button">Go to Dashboard</a>
            </center>
          </div>
          <div class="footer">
            <p style="margin: 0 0 8px 0; font-weight: 500; color: #374151;">BridgeLang</p>
            <p style="margin: 0; font-size: 13px;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}" style="color: #2563eb; text-decoration: none;">Home</a> · 
              <a href="mailto:support@bridgelang.co.uk" style="color: #2563eb; text-decoration: none;">Support</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.MAIL_FROM,
    to,
    subject: `Welcome to ${planName} - BridgeLang`,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Subscription confirmation sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Subscription email error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendCreditPurchaseConfirmation({ to, userName, credits, price }) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header" style="background: #eab308;">
            <h1>⚡ Credits Added</h1>
          </div>
          <div class="content">
            <p style="font-size: 17px; margin-bottom: 8px;">Hi <strong>${userName}</strong>,</p>
            <p style="color: #4b5563; margin-bottom: 24px; font-size: 15px;">
              Your account has been topped up! You're ready to book more lessons.
            </p>
            
            <div class="info-card" style="border-left-color: #eab308;">
              <h3 style="color: #a16207;">💳 Purchase Details</h3>
              <div class="details-row">
                <span class="details-label">Credits Added</span>
                <span class="details-value" style="font-size: 20px; color: #eab308;">${credits} Credits</span>
              </div>
              <div class="details-row">
                <span class="details-label">Amount Paid</span>
                <span class="details-value"><span class="badge" style="background: #eab308;">£${price}</span></span>
              </div>
            </div>
            
            <div class="tip-box" style="background: #fef3c7; border-left-color: #eab308;">
              <p style="color: #92400e;"><strong>💡 Ready to learn?</strong> Use your credits to book lessons with any teacher on our platform!</p>
            </div>
            
            <center>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/student/teachers" class="button">Browse Teachers</a>
            </center>
          </div>
          <div class="footer">
            <p style="margin: 0 0 8px 0; font-weight: 500; color: #374151;">BridgeLang</p>
            <p style="margin: 0; font-size: 13px;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}" style="color: #2563eb; text-decoration: none;">Home</a> · 
              <a href="mailto:support@bridgelang.co.uk" style="color: #2563eb; text-decoration: none;">Support</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.MAIL_FROM,
    to,
    subject: `${credits} credits added - BridgeLang`,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Credit purchase confirmation sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Credit email error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendNotificationEmail({ to, userName, senderName, messagePreview, link }) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header" style="background: #8b5cf6;">
            <h1>💬 New Message</h1>
          </div>
          <div class="content">
            <p style="font-size: 17px; margin-bottom: 8px;">Hi <strong>${userName}</strong>,</p>
            <p style="color: #4b5563; margin-bottom: 20px; font-size: 15px;">
              <strong>${senderName}</strong> sent you a message:
            </p>
            
            <div style="background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 20px; border-radius: 6px; margin: 24px 0;">
              <p style="margin: 0; color: #5b21b6; font-size: 15px; line-height: 1.6;">${messagePreview}</p>
            </div>
            
            <center>
              <a href="${link}" class="button" style="background: #8b5cf6;">View Message</a>
            </center>
          </div>
          <div class="footer">
            <p style="margin: 0 0 8px 0; font-weight: 500; color: #374151;">BridgeLang</p>
            <p style="margin: 0; font-size: 13px;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}" style="color: #2563eb; text-decoration: none;">Home</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.MAIL_FROM,
    to,
    subject: `New message from ${senderName} on BridgeLang`,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Notification email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Notification email error:', error);
    return { success: false, error: error.message };
  }
}
