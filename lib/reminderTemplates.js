// lib/reminderTemplates.js
/**
 * Phase 4: Lesson Reminder Email Templates
 */

export function get24hReminderEmail({ studentName, teacherName, date, startTime, timezone, duration }) {
    const subject = `📚 Lesson Tomorrow - ${teacherName}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #334155; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
        .info-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .checklist { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🎓 Lesson Reminder</h1>
          <p style="margin: 10px 0 0 0;">Your lesson is tomorrow!</p>
        </div>
        <div class="content">
          <p>Hi <strong>${studentName}</strong>,</p>
          <p>This is a friendly reminder that your lesson is coming up tomorrow.</p>
          <div class="info-box">
            <p><strong>📅 Date:</strong> ${date}</p>
            <p><strong>🕐 Time:</strong> ${startTime} (${timezone})</p>
            <p><strong>👨‍🏫 Teacher:</strong> ${teacherName}</p>
            <p><strong>⏱️ Duration:</strong> ${duration} minutes</p>
          </div>
          <div class="checklist">
            <h3>✅ Tips for a great lesson:</h3>
            <ul>
              <li>Test your camera and microphone 10 minutes before</li>
              <li>Prepare any questions you'd like to ask</li>
              <li>Have your notebook ready</li>
              <li>Find a quiet environment</li>
            </ul>
          </div>
          <center>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/student/dashboard" class="button">View Lesson Details</a>
          </center>
        </div>
      </div>
    </body>
    </html>
  `;

    return { subject, html };
}

export function get1hReminderEmail({ studentName, teacherName, startTime, timezone }) {
    const subject = `⏰ Lesson Starts in 1 Hour - ${teacherName}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #334155; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; text-align: center; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">⏰ Starting Soon!</h1>
          <p>Your lesson starts in 1 hour</p>
        </div>
        <div class="content">
          <p>Hi <strong>${studentName}</strong>,</p>
          <p style="font-size: 18px;">Your lesson with <strong>${teacherName}</strong> is starting soon!</p>
          <p><strong>Time:</strong> ${startTime} (${timezone})</p>
          <h3>Last-minute checklist:</h3>
          <p>✅ Quiet environment</p>
          <p>✅ Good internet</p>
          <p>✅ Charged device</p>
          <br>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/student/dashboard" class="button">Join Video Room (Available in 45 min)</a>
        </div>
      </div>
    </body>
    </html>
  `;

    return { subject, html };
}

export function get15mReminderEmail({ studentName, teacherName, meetingLink }) {
    const subject = `🚀 Join Now - Lesson Starting!`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #334155; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; text-align: center; }
        .button { display: inline-block; background: #10b981; color: white; padding: 20px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 36px;">🎓 Lesson Starting!</h1>
        </div>
        <div class="content">
          <p style="font-size: 20px; color: #059669; font-weight: 600;">Your lesson with ${teacherName} is starting RIGHT NOW!</p>
          <br>
          <a href="${meetingLink || process.env.NEXT_PUBLIC_BASE_URL + '/student/dashboard'}" class="button">🎥 JOIN VIDEO LESSON</a>
          <p style="color: #64748b; margin-top: 30px;">Your teacher is waiting!</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return { subject, html };
}

export function getBookingConfirmationEmail({ studentName, teacherName, date, startTime, timezone, duration, amountPaid }) {
    const subject = `✅ Booking Confirmed - ${teacherName}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #334155; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
        .info-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0; }
        .button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">✅ Booking Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${studentName}</strong>,</p>
          <p>Your lesson has been successfully booked!</p>
          <div class="info-box">
            <p><strong>Teacher:</strong> ${teacherName}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${startTime} (${timezone})</p>
            <p><strong>Duration:</strong> ${duration} minutes</p>
            <p><strong>Amount Paid:</strong> £${amountPaid?.toFixed(2)}</p>
          </div>
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>We'll send reminders 24h, 1h, and 15min before</li>
            <li>Video room opens 15 minutes early</li>
            <li>Payment held securely until completion</li>
          </ul>
          <center>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/student/dashboard" class="button">View My Lessons</a>
          </center>
        </div>
      </div>
    </body>
    </html>
  `;

    return { subject, html };
}
