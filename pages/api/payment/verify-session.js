// pages/api/payment/verify-session.js
// Fallback: Stripe webhook olmadan da plan güncellemesi yapabilmek için
// Success sayfası bu endpoint'i çağırarak ödemeyi doğrular ve planı günceller
import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';
import { PLAN_LIMITS } from '../../../lib/planLimits';
import { sendMail } from '../../../lib/mailer';
import { getBookingConfirmationEmail } from '../../../lib/reminderTemplates';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

  try {
    // Stripe'dan session bilgisini çek
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed', status: session.payment_status });
    }

    const metadata = session.metadata || {};

    // Handle lesson bookings — create booking as fallback if webhook hasn't fired yet
    if (metadata.bookingType === 'lesson') {
      const { teacherId, studentId, date, startTime, endTime, duration, location, lessonType, timezone: metaTimezone } = metadata;
      const timezone = metaTimezone || 'Europe/London';
      const amountPaid = session.amount_total / 100;

      // Check if booking already exists (webhook may have already created it)
      const existingBooking = await adminDb.collection('bookings').doc(session.id).get();
      if (!existingBooking.exists) {
        console.log('📚 verify-session: Creating booking as webhook fallback');
        await adminDb.collection('bookings').doc(session.id).set({
          teacherId,
          studentId,
          date,
          startTime,
          endTime: endTime || '',
          duration: Number(duration),
          location,
          lessonType: lessonType || 'standard',
          status: 'confirmed',
          amountPaid,
          stripeSessionId: session.id,
          timezone,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('✅ verify-session: Booking created:', session.id);

        // Booking confirmation email (when we created the booking; webhook may not have run)
        try {
          const [studentSnap, teacherSnap] = await Promise.all([
            adminDb.collection('users').doc(studentId).get(),
            adminDb.collection('users').doc(teacherId).get()
          ]);
          const studentData = studentSnap.exists ? studentSnap.data() : {};
          const teacherData = teacherSnap.exists ? teacherSnap.data() : {};
          if (studentData.email && studentData.emailNotifications !== false) {
            const { subject, html } = getBookingConfirmationEmail({
              studentName: studentData.name || 'Student',
              teacherName: teacherData.name || 'Teacher',
              date,
              startTime,
              timezone,
              duration: Number(duration) || 60,
              amountPaid
            });
            await sendMail({ to: studentData.email, subject, html });
            console.log('✅ verify-session: Booking confirmation email sent to', studentData.email);
          }
        } catch (mailErr) {
          console.warn('⚠️ verify-session: Booking confirmation email failed:', mailErr.message);
        }
      } else {
        console.log('✅ verify-session: Booking already exists (webhook handled it)');
      }

      return res.status(200).json({ 
        message: 'Lesson booking confirmed', 
        bookingType: 'lesson',
        bookingId: session.id 
      });
    }

    // Sadece subscription_upgrade tipindeki ödemeleri işle
    if (metadata.bookingType !== 'subscription_upgrade' && metadata.bookingType !== 'subscription') {
      return res.status(200).json({ message: 'Not a plan payment', bookingType: metadata.bookingType });
    }

    const userId = metadata.userId;
    const upgradeTo = (metadata.upgradeTo || 'free').toLowerCase();

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId in session metadata' });
    }

    const limits = PLAN_LIMITS[upgradeTo] || PLAN_LIMITS.free;
    const userRef = adminDb.collection('users').doc(userId);
    const currentSnap = await userRef.get();
    const currentData = currentSnap.exists ? currentSnap.data() : {};

    // Zaten güncellenmiş mi kontrol et (webhook çoktan işlemiş olabilir)
    if (currentData.subscriptionPlan === upgradeTo && currentData.justUpgraded === true) {
      console.log(`✅ verify-session: User ${userId} already on ${upgradeTo} (webhook handled it)`);
      // Clear justUpgraded flag so it doesn't show on next visit
      await userRef.update({ justUpgraded: false });
      return res.status(200).json({
        message: 'Already updated',
        plan: upgradeTo,
        limits,
      });
    }

    // Plan güncelle
    const currentSub = currentData.subscription || {};
    const isRenewal = metadata.renewal === '1';
    const upgradeFrom = metadata.upgradeFrom || currentData.subscriptionPlan || 'free';

    let lifetimePayments = currentSub.lifetimePayments || 0;
    if (isRenewal || upgradeFrom === upgradeTo) {
      lifetimePayments += 1;
    } else {
      lifetimePayments = 1;
    }

    const now = Date.now();
    const activeUntilMillis = now + 30 * 24 * 60 * 60 * 1000;

    const updateData = {
      subscriptionPlan: upgradeTo,
      viewLimit: limits.viewLimit,
      messagesLeft: limits.messagesLeft,
      justUpgraded: true,
      subscription: {
        planKey: upgradeTo,
        activeUntil: new Date(activeUntilMillis),
        activeUntilMillis,
        lastPaymentAt: new Date(),
        updatedAt: new Date(),
        lifetimePayments,
        pending_downgrade_to: null,
      },
    };

    await userRef.set(updateData, { merge: true });
    console.log(`✅ verify-session: User ${userId} upgraded to ${upgradeTo}, limits:`, limits);

    return res.status(200).json({
      message: 'Plan updated successfully',
      plan: upgradeTo,
      limits,
    });
  } catch (err) {
    console.error('❌ verify-session error:', err);
    return res.status(500).json({ error: 'Verification failed', details: err.message });
  }
}
