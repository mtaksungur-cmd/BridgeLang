import { buffer } from 'micro';
import Stripe from 'stripe';
import { adminDb } from '../../lib/firebaseAdmin';
import { DateTime } from 'luxon';
import { sendMail } from '../../lib/mailer';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

/* -------------------- Helpers -------------------- */
function toStartAtUtc({ date, startTime, timezone }) {
  try {
    const dt = DateTime.fromFormat(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm', { zone: timezone || 'UTC' });
    return dt.isValid ? dt.toUTC().toMillis() : null;
  } catch {
    return null;
  }
}

async function createDailyRoom({ teacherId, date, startTime, durationMinutes, timezone }) {
  if (!process.env.DAILY_API_KEY) throw new Error('DAILY_API_KEY missing');
  const dt = DateTime.fromFormat(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm', { zone: timezone || 'UTC' });
  const startSec = dt.toSeconds();
  const expSec = startSec + (durationMinutes || 60) * 60;

  const resp = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `lesson-${teacherId || 't'}-${Date.now()}`,
      properties: { nbf: Math.floor(startSec), exp: Math.floor(expSec), enable_screenshare: true, enable_chat: true },
    }),
  });

  const data = await resp.json();
  if (!resp.ok || !data?.url) throw new Error(`Daily API error: ${data?.error || 'unknown'}`);
  return data.url;
}

const PLAN_LIMITS = {
  free: { viewLimit: 10, messagesLeft: 3 },
  starter: { viewLimit: 30, messagesLeft: 8 },
  pro: { viewLimit: 60, messagesLeft: 20 },
  vip: { viewLimit: 9999, messagesLeft: 9999 },
};

/* 🔹 VIP kupon oluşturucu */
async function createVipLoyaltyCoupon(userId, lifetime) {
  const coupon = await stripe.coupons.create({
    percent_off: 10,
    duration: 'once',
    name: `VIP Loyalty Discount — Month ${lifetime}`,
  });
  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: `VIP-${userId.slice(0, 5)}-${lifetime}`,
    max_redemptions: 1,
  });
  return { coupon, promo };
}

/* -------------------- Handler -------------------- */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  /* -------------------------------------------------
   * ONE-OFF SUBSCRIPTION UPGRADE / RENEWALS
   * ------------------------------------------------- */
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata || {};

    // 🔹 One-off abonelik yükseltmesi
    if (meta.bookingType === 'subscription_upgrade') {
      const uref = adminDb.collection('users').doc(meta.userId);
      const snap = await uref.get();
      const udata = snap.exists ? snap.data() : {};
      const sub = udata.subscription || {};
      const lifetime = (sub.lifetimePayments || 0) + 1;

      const base = PLAN_LIMITS[meta.upgradeTo] || PLAN_LIMITS.free;
      const now = Date.now();
      const nextMonth = now + 30 * 86400000; // 30 gün ileri
      const updatedSub = {
        ...sub,
        planKey: meta.upgradeTo,
        activeUntil: new Date(nextMonth),
        activeUntilMillis: nextMonth,
        lastPaymentAt: new Date(),
        lifetimePayments: lifetime,
        pending_downgrade_to: null,
      };

      let subscriptionCoupons = Array.isArray(udata.subscriptionCoupons)
        ? [...udata.subscriptionCoupons]
        : [];

      // 🎁 VIP kupon kontrolü (6, 12, 18... ödemelerde oluştur)
      if (meta.upgradeTo === 'vip' && lifetime % 6 === 0) {
        try {
          const { coupon, promo } = await createVipLoyaltyCoupon(meta.userId, lifetime);
          subscriptionCoupons.push({
            code: promo.code,
            couponId: coupon.id,
            percent: 10,
            type: 'subscription',
            source: 'vip-loyalty',
            used: false,
            active: true,
            createdAt: new Date(),
            milestonePaymentNo: lifetime,
          });

          await sendMail({
            to: udata.email,
            subject: '🎁 VIP Loyalty Discount Activated',
            html: `
              <p>Hi ${udata.name || 'there'},</p>
              <p>Congratulations! You've unlocked a <b>10% VIP loyalty discount</b> for your next billing cycle.</p>
              <p>Your next VIP payment will automatically include this discount.</p>
              <p>Keep learning with BridgeLang!</p>
            `,
          });

          console.log(`🎁 VIP loyalty coupon created for ${meta.userId} (payment #${lifetime})`);
        } catch (e) {
          console.error('[VIP loyalty coupon error]', e);
        }
      }

      await uref.set(
        {
          subscriptionPlan: meta.upgradeTo,
          viewLimit: base.viewLimit,
          messagesLeft: base.messagesLeft,
          subscription: updatedSub,
          subscriptionCoupons,
        },
        { merge: true }
      );

      console.log(`✅ Subscription upgrade applied: ${meta.upgradeFrom} → ${meta.upgradeTo}`);
      return res.status(200).json({ received: true });
    }

    // 🔹 Normal ders ödemesi
    if (meta.bookingType === 'lesson') {
      const { teacherId, studentId, date, startTime, endTime, duration, location, timezone } = meta;
      const durationMinutes = parseInt(duration, 10) || 60;
      const startAtUtc = toStartAtUtc({ date, startTime, timezone });
      const bookingRef = adminDb.collection('bookings').doc(session.id);

      const originalCents = Number(meta.original_unit_amount || 0);
      const discountedCents = Number(meta.discounted_unit_amount || session.amount_total || 0);
      const discountPercent = Number(meta.discountPercent || 0);

      const originalPrice = originalCents / 100;
      const paidAmount = discountedCents / 100;
      const teacherShare = (originalCents * 0.8) / 100;
      const platformSubsidy = Math.max(0, originalPrice - paidAmount);

      let meetingLink = '';
      if (location === 'Online') {
        try {
          meetingLink = await createDailyRoom({ teacherId, date, startTime, durationMinutes, timezone });
        } catch (e) {
          console.error('Daily create exception:', e);
        }
      }

      await bookingRef.set(
        {
          teacherId,
          studentId,
          date,
          startTime,
          endTime,
          duration: durationMinutes,
          location,
          meetingLink,
          amountPaid: paidAmount,
          originalPrice,
          discountPercent,
          teacherShare,
          platformSubsidy,
          discountLabel: meta.discountLabel || '',
          status: 'pending-approval',
          teacherApproved: false,
          studentConfirmed: false,
          reminderSent: false,
          timezone,
          startAtUtc,
          stripeSessionId: session.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true }
      );

      // 🔄 Ders alan öğrenci kupon aktivasyonu
      if (studentId) {
        const uref = adminDb.collection('users').doc(studentId);
        const usnap = await uref.get();
        const userData = usnap.exists ? usnap.data() : {};
        const lessonsTaken = (userData.lessonsTaken || 0) + 1;
        let lessonCoupons = userData.lessonCoupons || [];

        if (lessonsTaken >= 6) {
          const updated = [];
          for (const c of lessonCoupons) {
            if (!c.active && !c.used && c.type === 'lesson' && c.code?.startsWith('REV-')) {
              try {
                await stripe.promotionCodes.update(c.promoId || c.code, { active: true });
                c.active = true;
                console.log(`✅ Review coupon activated for ${studentId}: ${c.code}`);
              } catch (err) {
                console.warn(`⚠️ Could not activate review coupon ${c.code}:`, err.message);
              }
            }
            updated.push({ ...c, used: !!c.used, active: !!c.active });
          }
          lessonCoupons = updated;
        }

        await uref.update({ lessonsTaken, lessonCoupons });
        console.log(`📘 Lesson count updated for ${studentId}: ${lessonsTaken}`);
      }

      return res.status(200).json({ received: true });
    }
  }

  return res.status(200).json({ received: true });
}
