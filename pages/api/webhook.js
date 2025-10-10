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
  const expSec   = startSec + (durationMinutes || 60) * 60;

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

/* -------------------- Limits -------------------- */
const PLAN_LIMITS = {
  free:    { viewLimit: 10,  messagesLeft: 3  },
  starter: { viewLimit: 30,  messagesLeft: 8  },
  pro:     { viewLimit: 60,  messagesLeft: 20 },
  vip:     { viewLimit: 9999,messagesLeft: 9999 },
};

/* -------------------- Sadakat bonusu oluşturucu -------------------- */
async function createLoyaltyLessonCoupon(plan, lifetime) {
  const percent = plan === 'vip' ? 20 : plan === 'pro' ? 10 : 0;
  if (!percent) return null;
  if (lifetime % 3 !== 0) return null; // her 3., 6., 9. ödeme

  const coupon = await stripe.coupons.create({
    percent_off: percent,
    duration: 'once',
    name: `${plan.toUpperCase()} Loyalty — Payment #${lifetime}`,
  });
  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: `LOY-${plan}-${lifetime}-${Date.now().toString().slice(-5)}`,
    max_redemptions: 1,
  });
  return { code: promo.code, promoId: promo.id, percent };
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
    const meta    = session.metadata || {};

    // 🔹 Abonelik (one-off) – upgrade / renewal
    if (meta.bookingType === 'subscription_upgrade') {
      const userId = meta.userId;
      const uref   = adminDb.collection('users').doc(userId);
      const snap   = await uref.get();
      const udata  = snap.exists ? snap.data() : {};
      const sub    = udata.subscription || {};

      const lifetime = (sub.lifetimePayments || 0) + 1;
      const plan     = meta.upgradeTo;
      const base     = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

      // Yeni dönem: 30 gün ileri
      const now       = Date.now();
      const nextMonth = now + 30 * 86400000;

      const updatedSub = {
        ...sub,
        planKey: plan,
        activeUntil: new Date(nextMonth),
        activeUntilMillis: nextMonth,
        lastPaymentAt: new Date(),
        lifetimePayments: lifetime,
        pending_downgrade_to: null,
      };

      // 🔹 Uygulanmış VIP kuponu (varsa)
      let subscriptionCoupons = Array.isArray(udata.subscriptionCoupons)
        ? [...udata.subscriptionCoupons]
        : [];
      if (meta.vipAppliedCouponId) {
        subscriptionCoupons.push({
          code: meta.vipAppliedCouponId,
          percent: 10,
          type: 'subscription',
          source: 'vip-loyalty-auto',
          used: true,
          active: false,
          createdAt: new Date(),
          appliedOnPaymentNo: Number(meta.vipNextPaymentNo || lifetime),
        });
      }

      // 🔹 Sadakat bonusu oluştur (her 3 ayda bir)
      let lessonCoupons = Array.isArray(udata.lessonCoupons) ? [...udata.lessonCoupons] : [];
      const loyalty = await createLoyaltyLessonCoupon(plan, lifetime);
      if (loyalty) {
        lessonCoupons.push({
          code: loyalty.code,
          promoId: loyalty.promoId,
          percent: loyalty.percent,
          type: 'lesson',
          source: 'loyalty-3x',
          active: true,
          used: false,
          createdAt: new Date(),
          milestonePaymentNo: lifetime,
        });

        // 🎁 bilgilendirme e-postası
        try {
          await sendMail({
            to: udata.email,
            subject: `🎁 ${plan.toUpperCase()} Loyalty Bonus — ${loyalty.percent}% Off`,
            html: `
              <p>Hi ${udata.name || 'there'},</p>
              <p>Congratulations! You've unlocked a <b>${loyalty.percent}% loyalty discount</b> for your next lesson booking.</p>
              <p>Use your loyalty coupon code: <b>${loyalty.code}</b></p>
              <p>Keep learning with BridgeLang!</p>
            `,
          });
        } catch (e) {
          console.warn('⚠️ Loyalty email failed:', e.message);
        }
      }

      // 🔹 Firestore güncelle
      await uref.set({
        subscriptionPlan: plan,
        viewLimit: base.viewLimit,
        messagesLeft: base.messagesLeft,
        subscription: updatedSub,
        subscriptionCoupons,
        lessonCoupons,
      }, { merge: true });

      console.log(
        `✅ Subscription ${meta.renewal === '1' ? 'renewed' : 'changed'}: ${meta.upgradeFrom} → ${plan} | lifetime #${lifetime} | loyalty=${!!loyalty}`
      );
      return res.status(200).json({ received: true });
    }

    // 🔹 Normal ders ödemesi
    if (meta.bookingType === 'lesson') {
      const { teacherId, studentId, date, startTime, endTime, duration, location, timezone } = meta;
      const durationMinutes = parseInt(duration, 10) || 60;
      const startAtUtc      = toStartAtUtc({ date, startTime, timezone });
      const bookingRef      = adminDb.collection('bookings').doc(session.id);

      const originalCents    = Number(meta.original_unit_amount || 0);
      const discountedCents  = Number(meta.discounted_unit_amount || session.amount_total || 0);
      const discountPercent  = Number(meta.discountPercent || 0);

      const originalPrice   = originalCents / 100;
      const paidAmount      = discountedCents / 100;
      const teacherShare    = (originalCents * 0.8) / 100;
      const platformSubsidy = Math.max(0, originalPrice - paidAmount);

      let meetingLink = '';
      if (location === 'Online') {
        try {
          meetingLink = await createDailyRoom({ teacherId, date, startTime, durationMinutes, timezone });
        } catch (e) {
          console.error('Daily create exception:', e);
        }
      }

      await bookingRef.set({
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
      }, { merge: true });

      // 🔹 Öğrenci kupon aktivasyonu (mevcut akış)
      if (studentId) {
        const uref    = adminDb.collection('users').doc(studentId);
        const usnap   = await uref.get();
        const u       = usnap.exists ? usnap.data() : {};
        const taken   = (u.lessonsTaken || 0) + 1;
        let coupons   = u.lessonCoupons || [];

        if (taken >= 6) {
          const updated = [];
          for (const c of coupons) {
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
          coupons = updated;
        }

        await uref.update({ lessonsTaken: taken, lessonCoupons: coupons });
        console.log(`📘 Lesson count updated for ${studentId}: ${taken}`);
      }

      return res.status(200).json({ received: true });
    }
  }

  return res.status(200).json({ received: true });
}
