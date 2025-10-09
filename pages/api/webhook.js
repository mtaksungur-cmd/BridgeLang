// pages/api/payment/webhook.js
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
  return { couponId: coupon.id, percent };
}

function pushUnique(arr, item) {
  const exists = (arr || []).some((x) => x.code === item.code);
  return exists ? arr : [...(arr || []), item];
}

/* ---- Price → planKey map (recurring) ---- */
const PRICE_TO_PLAN = {
  [process.env.STRIPE_PRICE_ID_STARTER || '']: 'starter',
  [process.env.STRIPE_PRICE_ID_PRO || '']: 'pro',
  [process.env.STRIPE_PRICE_ID_VIP || '']: 'vip',
};

const PLAN_LIMITS = {
  free: { viewLimit: 10, messagesLeft: 3 },
  starter: { viewLimit: 30, messagesLeft: 8 },
  pro: { viewLimit: 60, messagesLeft: 20 },
  vip: { viewLimit: 9999, messagesLeft: 9999 },
};

/* ---------- Lifetime & Kupon: ortak yardımcı ---------- */
async function applyLifetimeAndCouponsForDocs({ docs, planKey, invoice, subscriptionId }) {
  if (!invoice) return;
  const paid = !!invoice.paid;
  const invoiceId = invoice.id;
  const amountDue = invoice.amount_due || 0;
  if (!invoiceId) return;
  if (!paid) return;

  for (const doc of docs) {
    const udata = doc.data();
    const sub = udata.subscription || {};
    const lastInvoiceId = sub.lastInvoiceId || null;
    if (lastInvoiceId === invoiceId) continue;

    const lifetime = Number(sub.lifetimePayments || 0) + 1;
    let lessonCoupons = Array.isArray(udata.lessonCoupons) ? udata.lessonCoupons : [];
    let subscriptionCoupons = Array.isArray(udata.subscriptionCoupons) ? udata.subscriptionCoupons : [];

    if (lifetime % 3 === 0 && (planKey === 'pro' || planKey === 'vip')) {
      try {
        const loyalty = await createLoyaltyLessonCoupon(planKey);
        if (loyalty) {
          loyalty.milestonePaymentNo = lifetime;
          lessonCoupons = pushUnique(lessonCoupons, loyalty);
        }
      } catch (e) {
        console.warn('[webhook] loyalty coupon creation failed:', e?.message || e);
      }
    }

    if (planKey === 'vip' && lifetime % 6 === 0) {
      try {
        const vip = await createVipSubscriptionMilestoneCoupon();
        if (vip?.couponId) {
          await stripe.subscriptions.update(subscriptionId, { coupon: vip.couponId });
          subscriptionCoupons = pushUnique(subscriptionCoupons, {
            code: vip.couponId,
            percent: 10,
            type: 'subscription',
            source: 'vip-6x',
            used: false,
            active: true,
            createdAt: new Date(),
            milestonePaymentNo: lifetime,
          });
        }
      } catch (e) {
        console.warn('[webhook] VIP6 coupon apply failed:', e?.message || e);
      }
    }

    await doc.ref.set(
      {
        lessonCoupons,
        subscriptionCoupons,
        subscription: {
          ...(sub || {}),
          lifetimePayments: lifetime,
          lastInvoiceId: invoiceId,
          lastPaymentAt: new Date(),
        },
      },
      { merge: true }
    );

    console.log(`🔥 lifetimePayments -> ${lifetime} (${doc.id})`);
  }
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
   * A) RECURRING SUBSCRIPTION EVENTLERİ
   * ------------------------------------------------- */
  if (event.type === 'customer.subscription.created') {
    const sub = event.data.object;
    const userId = sub.metadata?.userId;
    if (!userId) return res.status(200).json({ received: true });

    const item = sub.items?.data?.[0];
    const priceId = item?.price?.id || '';
    const planKey = PRICE_TO_PLAN[priceId] || 'starter';
    const currentEnd = sub.current_period_end ? sub.current_period_end * 1000 : Date.now() + 30 * 86400000;

    const uref = adminDb.collection('users').doc(userId);
    await uref.set(
      {
        subscriptionPlan: planKey,
        viewLimit: PLAN_LIMITS[planKey].viewLimit,
        messagesLeft: PLAN_LIMITS[planKey].messagesLeft,
        subscription: {
          planKey,
          activeUntil: new Date(currentEnd),
          activeUntilMillis: currentEnd,
          lastPaymentAt: new Date(),
          lifetimePayments: 1,
          lastInvoiceId: null,
          pending_downgrade_to: null,
        },
        stripe: {
          customerId: sub.customer,
          subscriptionId: sub.id,
          subscriptionItemId: item?.id,
        },
      },
      { merge: true }
    );

    try {
      const profile = (await uref.get()).data();
      if (profile?.email) {
        await sendMail({
          to: profile.email,
          subject: '✅ Subscription activated',
          html: `<p>Your ${planKey.toUpperCase()} plan is active. Renewal date: ${new Date(currentEnd).toDateString()}.</p>`,
        });
      }
    } catch (e) {
      console.warn('[webhook] create email failed:', e?.message || e);
    }

    return res.status(200).json({ received: true });
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object;
    const item = sub.items?.data?.[0];
    const priceId = item?.price?.id || '';
    const planKey = PRICE_TO_PLAN[priceId] || null;
    const currentEnd = (sub.current_period_end || 0) * 1000 || Date.now() + 30 * 86400000;
    const customerId = sub.customer;
    const q = await adminDb.collection('users').where('stripe.customerId', '==', customerId).get();

    for (const doc of q.docs) {
      const uref = doc.ref;
      const udata = doc.data();

      const update = {
        stripe: {
          ...(udata.stripe || {}),
          subscriptionId: sub.id,
          subscriptionItemId: item?.id || udata?.stripe?.subscriptionItemId,
        },
        subscription: {
          ...(udata.subscription || {}),
          activeUntil: new Date(currentEnd),
          activeUntilMillis: currentEnd,
        },
      };

      if (planKey) {
        update.subscriptionPlan = planKey;
        update.subscription.planKey = planKey;
        update.viewLimit = PLAN_LIMITS[planKey].viewLimit;
        update.messagesLeft = PLAN_LIMITS[planKey].messagesLeft;
        update.subscription.pending_downgrade_to = null;
      }

      await uref.set(update, { merge: true });
    }

    try {
      if (sub.latest_invoice) {
        const invoice = await stripe.invoices.retrieve(sub.latest_invoice);
        const effPlan = planKey || (PRICE_TO_PLAN[sub.items?.data?.[0]?.price?.id || ''] || 'starter');
        await applyLifetimeAndCouponsForDocs({ docs: q.docs, planKey: effPlan, invoice, subscriptionId: sub.id });
      }
    } catch (e) {
      console.warn('[webhook] lifetime/coupon on subscription.updated failed:', e?.message || e);
    }

    return res.status(200).json({ received: true });
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) return res.status(200).json({ received: true });

    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const item = sub.items?.data?.[0];
    const priceId = item?.price?.id || '';
    const planKey = PRICE_TO_PLAN[priceId] || 'starter';
    const currentEnd = (sub.current_period_end || 0) * 1000 || Date.now() + 30 * 86400000;
    const customerId = sub.customer;
    const q = await adminDb.collection('users').where('stripe.subscriptionId', '==', subscriptionId).get();

    for (const doc of q.docs) {
      const udata = doc.data();
      const pending = udata?.subscription?.pending_downgrade_to || null;
      let finalPlan = planKey;

      if (pending && pending !== 'free') {
        finalPlan = pending;
        const targetPriceId =
          pending === 'starter'
            ? process.env.STRIPE_PRICE_ID_STARTER
            : pending === 'pro'
            ? process.env.STRIPE_PRICE_ID_PRO
            : process.env.STRIPE_PRICE_ID_VIP;

        if (targetPriceId) {
          try {
            await stripe.subscriptions.update(subscriptionId, {
              cancel_at_period_end: false,
              proration_behavior: 'none',
              items: [{ id: item.id, price: targetPriceId }],
            });
          } catch (e) {
            console.warn('[webhook] pending downgrade switch failed:', e?.message || e);
          }
        }
      }

      const base = PLAN_LIMITS[finalPlan] || PLAN_LIMITS.free;

      await doc.ref.set(
        {
          subscriptionPlan: finalPlan,
          viewLimit: base.viewLimit,
          messagesLeft: base.messagesLeft,
          subscription: {
            ...(udata.subscription || {}),
            planKey: finalPlan,
            activeUntil: new Date(currentEnd),
            activeUntilMillis: currentEnd,
            pending_downgrade_to: pending === 'free' ? 'free' : null,
          },
          stripe: {
            ...(udata.stripe || {}),
            customerId,
            subscriptionId: sub.id,
            subscriptionItemId: item?.id,
          },
        },
        { merge: true }
      );
    }

    try {
      await applyLifetimeAndCouponsForDocs({ docs: q.docs, planKey, invoice, subscriptionId: sub.id });
    } catch (e) {
      console.warn('[webhook] lifetime/coupon on invoice.payment_succeeded failed:', e?.message || e);
    }

    return res.status(200).json({ received: true });
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const customerId = sub.customer;
    const q = await adminDb.collection('users').where('stripe.customerId', '==', customerId).get();

    for (const doc of q.docs) {
      const u = doc.data();
      await doc.ref.set(
        {
          subscriptionPlan: 'free',
          viewLimit: PLAN_LIMITS.free.viewLimit,
          messagesLeft: PLAN_LIMITS.free.messagesLeft,
          subscription: { ...(u.subscription || {}), planKey: 'free', pending_downgrade_to: null },
          stripe: { ...(u.stripe || {}), subscriptionId: null, subscriptionItemId: null },
        },
        { merge: true }
      );

      try {
        if (u?.email) {
          await sendMail({
            to: u.email,
            subject: 'ℹ️ Subscription ended — moved to FREE',
            html: `<p>Your paid subscription has ended. Your account is now on the <b>FREE</b> plan.</p>`,
          });
        }
      } catch (e) {
        console.warn('[webhook] free mail failed:', e?.message || e);
      }
    }

    return res.status(200).json({ received: true });
  }

  /* -------------------------------------------------
   * B) DERS + ONE-OFF UPGRADE ÖDEMELERİ
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

      await uref.set(
        {
          subscriptionPlan: meta.upgradeTo,
          subscription: {
            ...sub,
            planKey: meta.upgradeTo,
            lastPaymentAt: new Date(),
            lifetimePayments: lifetime,
            pending_downgrade_to: null,
          },
        },
        { merge: true }
      );

      console.log(`✅ One-off upgrade applied: ${meta.upgradeFrom} → ${meta.upgradeTo} for ${meta.userId}`);
      return res.status(200).json({ received: true });
    }

    // 🔹 Normal ders ödemesi (mevcut mantık)
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
