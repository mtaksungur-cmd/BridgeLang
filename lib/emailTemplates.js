// Email subscription reminder templates
export async function sendSubscriptionWelcome({ to, userName, plan, viewLimit, messagesLeft }) {
    const planEmoji = { starter: '✨', pro: '⚡', vip: '👑' }[plan] || '🎉';
    const planName = { starter: 'Starter', pro: 'PRO', vip: 'VIP' }[plan] || plan.toUpperCase();
    const planColor = { starter: '#10b981', pro: '#2563eb', vip: '#8b5cf6' }[plan] || '#10b981';

    const benefits = {
        starter: ['60 teacher views per month', '20 messages', 'Priority support', 'Exclusive teacher access'],
        pro: ['Unlimited teacher views', 'Unlimited messages', '24/7 VIP support', '20% discount on all lessons'],
        vip: ['Everything in PRO', 'Personal learning advisor', '30% discount on lessons', 'Early access to new features']
    }[plan] || [];

    const baseStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; background: #f3f4f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #f3f4f6; }
    .card { background: white; margin: 24px 16px; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { padding: 40px 24px; text-align: center; }
    .content { padding: 32px 24px; }
    .benefit { margin: 8px 0; font-size: 15px; }
    .button { display: inline-block; color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
  `;

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
          <div class="header" style="background: ${planColor}; color: white;">
            <h1>${planEmoji} Welcome to BridgeLang ${planName}!</h1>
          </div>
          <div class="content">
            <p style="font-size: 17px;">Hi <strong>${userName}</strong>,</p>
            <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px;">Congratulations! You've just upgraded to <strong>BridgeLang ${planName}</strong>. 🎉</p>
            
            <h3 style="color: ${planColor};">Your Premium Benefits:</h3>
            ${benefits.map(b => `<p class="benefit"><strong>✓</strong> ${b}</p>`).join('')}

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/student/teachers" class="button" style="background: ${planColor};">Find Teachers Now</a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">Need help? Reply to this email or visit our Help Center.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} BridgeLang Ltd. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

    // Return the email config to be sent
    return {
        from: `"BridgeLang ${planName}" <${process.env.SMTP_USER}>`,
        to,
        subject: `🎉 Welcome to BridgeLang ${planName}!`,
        html: htmlContent,
    };
}

export async function sendLessonReminder({ to, studentName, teacherName, lessonDate, lessonTime, duration, location, meetingLink }) {
    const baseStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; background: #f3f4f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #f3f4f6; }
    .card { background: white; margin: 24px 16px; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: #f59e0b; padding: 40px 24px; text-align: center; color: white; }
    .content { padding: 32px 24px; }
    .detail { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #10b981; color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
  `;

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
            <h1>⏰ Lesson Reminder</h1>
          </div>
          <div class="content">
            <p style="font-size: 17px;">Hi <strong>${studentName}</strong>,</p>
            <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px;">Your lesson with <strong>${teacherName}</strong> is coming up!</p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #d97706;">Lesson Details:</h3>
              <div class="detail">
                <span>📅 Date</span>
                <span><strong>${lessonDate}</strong></span>
              </div>
              <div class="detail">
                <span>⏰ Time</span>
                <span><strong>${lessonTime}</strong></span>
              </div>
              <div class="detail">
                <span>⏱️ Duration</span>
                <span><strong>${duration} minutes</strong></span>
              </div>
              <div class="detail" style="border-bottom: none;">
                <span>📍 Location</span>
                <span><strong>${location}</strong></span>
              </div>
            </div>

            ${meetingLink ? `
              <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                <p style="margin: 0; color: #065f46;"><strong>🎥 Online Lesson:</strong> Join 5 minutes early to test your connection.</p>
              </div>
              <div style="text-align: center;">
                <a href="${meetingLink}" class="button">Join Lesson</a>
              </div>
            ` : ''}

            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">See you soon! If you need to reschedule, contact ${teacherName} ASAP.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} BridgeLang Ltd. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

    return {
        from: `"BridgeLang Reminders" <${process.env.SMTP_USER}>`,
        to,
        subject: `⏰ Reminder: Lesson with ${teacherName} tomorrow`,
        html: htmlContent,
    };
}
