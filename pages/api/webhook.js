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
      properties: {
        nbf: Math.floor(startSec),
        exp: Math.floor(expSec),
        enable_screenshare: true,
        enable_chat: true,
      },
    }),
  });

  const data = await resp.json();
  if (!resp.ok || !data?.url) throw new Error(`Daily API error: ${data?.error || 'unknown'}`);
  return data.url;
}

function randCode(n = 8) {
  const s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'BL-';
  for (let i = 0; i < n; i++) out += s[Math.floor(Math.random() * s.length)];
  return out;
}

/* ---------- Coupon Builders ---------- */
async function createLoyaltyLessonCoupon(plan) {
  let percent = 0;
  if (plan === 'pro') percent = 10;
  if (plan === 'vip') percent = 20;
  if (!percent) return null;

  const coupon = await stripe.coupons.create({ percent_off: percent, duration: 'once' });
  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: randCode(),
    max_redemptions: 1,
    active: true,
  });

  return {
    code: promo.code,
    promoId: promo.id,
    discount: percent,
    percent,
    type: 'lesson',
    source: 'loyalty-3x',
    active: true,
    used: false,
    createdAt: new Date(),
  };
}

async function createVipSubscriptionMilestoneCoupon() {
  const percent = 10;
  const coupon = await stripe.coupons.create({ percent_off: percent, duration: 'once' });
  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: randCode(),
    max_redemptions: 1,
    active: true,
  });

  return {
    code: promo.code,
    promoId: promo.id,
    discount: percent,
    percent,
    type: 'subscription',
    source: 'vip-6x',
    active: true,
    used: false,
    createdAt: new Date(),
  };
}

function pushUnique(arr, item) {
  const exists = (arr || []).some((x) => x.code === item.code);
  return exists ? arr : [...(arr || []), item];
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

  const PLAN_LIMITS = {
    free: { viewLimit: 10, messagesLeft: 3 },
    starter: { viewLimit: 30, messagesLeft: 8 },
    pro: { viewLimit: 60, messagesLeft: 20 },
    vip: { viewLimit: 9999, messagesLeft: 9999 },
  };

  /* -------------------------------------------------
     ✅ 1. PLAN ÖDEMELERİ (Abonelik / Upgrade)
  -------------------------------------------------- */
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata || {};

    if (meta.bookingType === 'plan') {
      const { userId, planKey } = meta;
      if (!userId || !planKey) return res.status(200).json({ received: true });

      const uref = adminDb.collection('users').doc(userId);
      const usnap = await uref.get();
      const u = usnap.exists ? usnap.data() : {};

      const existed = u?.subscription?.activeUntilMillis || 0;
      const baseMs = Math.max(existed, Date.now());
      const newUntil = baseMs + 30 * 86400000;
      const lifetime = Number(u?.subscription?.lifetimePayments || 0) + 1;
      const base = PLAN_LIMITS[planKey] || PLAN_LIMITS.free;

      let lessonCoupons = u?.lessonCoupons || [];
      let subscriptionCoupons = u?.subscriptionCoupons || [];

      // 🎯 3. ödeme → DERS kuponu
      if (lifetime % 3 === 0 && (planKey === 'pro' || planKey === 'vip')) {
        try {
          const loyaltyCoupon = await createLoyaltyLessonCoupon(planKey);
          if (loyaltyCoupon) {
            loyaltyCoupon.milestonePaymentNo = lifetime;
            lessonCoupons = pushUnique(lessonCoupons, loyaltyCoupon);
            console.log(`🎁 Loyalty lesson coupon added for ${userId} at payment #${lifetime}`);
          }
        } catch (e) {
          console.error('⚠️ Loyalty lesson coupon create failed:', e?.message || e);
        }
      }

      // 🏆 6. ödeme → VIP abonelik kuponu
      if (planKey === 'vip' && lifetime % 6 === 0) {
        try {
          const vip6 = await createVipSubscriptionMilestoneCoupon();
          if (vip6) {
            vip6.milestonePaymentNo = lifetime;
            subscriptionCoupons = pushUnique(subscriptionCoupons, vip6);
            console.log(`🏆 VIP 6x subscription coupon added for ${userId} at payment #${lifetime}`);
          }
        } catch (e) {
          console.error('⚠️ VIP 6x subscription coupon create failed:', e?.message || e);
        }
      }

      // 🔹 Abonelik güncelle
      await uref.set(
        {
          subscriptionPlan: planKey,
          viewLimit: base.viewLimit,
          messagesLeft: base.messagesLeft,
          subscription: {
            planKey,
            activeUntil: new Date(newUntil),
            activeUntilMillis: newUntil,
            lastPaymentAt: new Date(),
            lifetimePayments: lifetime,
            pending_downgrade_to: null,
          },
          lessonCoupons,
          subscriptionCoupons,
        },
        { merge: true }
      );

      // 🔸 Upgrade bildirimi
      try {
        if (u?.email) {
          await sendMail({
            to: u.email,
            subject: '✅ Subscription upgraded',
            html: `
              <p>Hi ${u.name || ''},</p>
              <p>Your plan has been upgraded to <b>${planKey.toUpperCase()}</b>.</p>
              <p>The change is effective immediately. Enjoy your new benefits!</p>
              <p>— BridgeLang Team</p>
            `,
          });
        }
      } catch (err) {
        console.warn('⚠️ Could not send upgrade email:', err.message);
      }

      console.log(`✅ Plan activated for ${userId} (${planKey}) — lifetime #${lifetime}`);
      return res.status(200).json({ received: true });
    }

    /* -------------------------------------------------
       🔹 DERS ÖDEMESİ (lesson)
    -------------------------------------------------- */
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

      // 🔄 Ders sayısı + review kupon aktivasyonu
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
    }
  }

  /* -------------------------------------------------
     🔹 2. Faturalama Sonrası Dönem Sonu Downgrade
  -------------------------------------------------- */
  if (event.type === 'invoice.payment_succeeded') {
    const data = event.data.object;
    const customerEmail = data.customer_email;

    if (customerEmail) {
      const query = await adminDb.collection('users').where('email', '==', customerEmail).get();
      for (const doc of query.docs) {
        const u = doc.data();
        const pending = u?.subscription?.pending_downgrade_to;
        if (pending) {
          const base = PLAN_LIMITS[pending] || PLAN_LIMITS.free;
          await doc.ref.update({
            subscriptionPlan: pending,
            viewLimit: base.viewLimit,
            messagesLeft: base.messagesLeft,
            'subscription.planKey': pending,
            'subscription.pending_downgrade_to': null,
          });
          console.log(`🔽 Downgrade applied for ${doc.id} → ${pending}`);
        }
      }
    }
  }

  return res.status(200).json({ received: true });
}
