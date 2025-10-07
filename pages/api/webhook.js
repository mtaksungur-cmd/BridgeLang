import { buffer } from 'micro';
import Stripe from 'stripe';
import { adminDb } from '../../lib/firebaseAdmin';
import { DateTime } from 'luxon';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

/* -------------------- Helpers -------------------- */
function toStartAtUtc({ date, startTime, timezone }) {
  try {
    const dt = DateTime.fromFormat(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm', { zone: timezone || 'UTC' });
    return dt.isValid ? dt.toUTC().toMillis() : null;
  } catch { return null; }
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

async function createCouponForPlan(plan, type = 'lesson') {
  let percent = 0;
  if (type === 'lesson') {
    if (plan === 'starter') percent = 5;
    if (plan === 'pro')     percent = 10;
    if (plan === 'vip')     percent = 20;
  }
  if (type === 'subscription' && plan === 'vip') percent = 10;
  if (!percent) return null;

  const coupon = await stripe.coupons.create({ percent_off: percent, duration: 'once' });
  const promo  = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: randCode(),
    max_redemptions: 1,
    active: true,
  });
  return { code: promo.code, discount: percent, type };
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
    free:    { viewLimit: 10, messagesLeft: 3 },
    starter: { viewLimit: 30, messagesLeft: 8 },
    pro:     { viewLimit: 60, messagesLeft: 20 },
    vip:     { viewLimit: 9999, messagesLeft: 9999 },
  };

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata || {};

    /* ─ A) Plan ödemesi (one-off) ─ */
    if (meta.bookingType === 'plan') {
      const { userId, planKey } = meta;
      if (!userId || !planKey) return res.status(200).json({ received: true });

      const uref = adminDb.collection('users').doc(userId);
      const usnap = await uref.get();
      const u = usnap.exists ? usnap.data() : {};

      const existed = u?.subscription?.activeUntilMillis || 0;
      const baseMs  = Math.max(existed, Date.now());
      const newUntil = baseMs + 30 * 86400000;
      const lifetime = Number(u?.subscription?.lifetimePayments || 0) + 1;
      const base = PLAN_LIMITS[planKey] || PLAN_LIMITS.free;

      let lessonCoupons = u?.lessonCoupons || [];
      let subscriptionCoupons = u?.subscriptionCoupons || [];

      if (planKey === 'vip' && lifetime % 3 === 0) {
        const c = await createCouponForPlan('vip', 'subscription');
        if (c) subscriptionCoupons.push({ ...c, createdAt: new Date() });
      }

      await uref.set({
        subscriptionPlan: planKey,
        viewLimit: base.viewLimit,
        messagesLeft: base.messagesLeft,
        subscription: {
          planKey,
          activeUntil: new Date(newUntil),
          activeUntilMillis: newUntil,
          lastPaymentAt: new Date(),
          lifetimePayments: lifetime,
        },
        lessonCoupons,
        subscriptionCoupons,
      }, { merge: true });

      console.log(`✅ One-off plan activated for ${userId} (${planKey})`);
      return res.status(200).json({ received: true });
    }

    /* ─ B) Ders ödemesi ─ */
    if (meta.bookingType === 'lesson') {
      const { teacherId, studentId, date, startTime, endTime, duration, location, timezone } = meta;
      const durationMinutes = parseInt(duration, 10) || 60;
      const startAtUtc = toStartAtUtc({ date, startTime, timezone });
      const bookingRef = adminDb.collection('bookings').doc(session.id);

      let meetingLink = '';
      if (location === 'Online') {
        try { meetingLink = await createDailyRoom({ teacherId, date, startTime, durationMinutes, timezone }); }
        catch (e) { console.error('Daily create exception:', e); }
      }

      await bookingRef.set({
        teacherId, studentId, date, startTime, endTime,
        duration: durationMinutes, location, meetingLink,
        amountPaid: session.amount_total ? session.amount_total / 100 : null,
        status: 'pending-approval',
        teacherApproved: false, studentConfirmed: false,
        reminderSent: false, timezone, startAtUtc,
        stripeSessionId: session.id,
        createdAt: new Date(), updatedAt: new Date()
      }, { merge: true });

      // ➜ Ders sayısını artır + 6. dersten sonra review kuponlarını aktif et
      if (studentId) {
        const uref = adminDb.collection('users').doc(studentId);
        const usnap = await uref.get();
        const userData = usnap.exists ? usnap.data() : {};
        const lessonsTaken = (userData.lessonsTaken || 0) + 1;

        let lessonCoupons = Array.isArray(userData.lessonCoupons) ? [...userData.lessonCoupons] : [];

        if (lessonsTaken >= 6 && lessonCoupons.length) {
          lessonCoupons = await Promise.all(lessonCoupons.map(async (c) => {
            // normalize fields (geri uyumluluk)
            c.percent = typeof c.percent === 'number' ? c.percent : (typeof c.discount === 'number' ? c.discount : 0);
            if (typeof c.active !== 'boolean') c.active = false;
            if (typeof c.used   !== 'boolean') c.used   = false;

            // sadece REV- tipi, pasif ve kullanılmamış olanları aktifleştir
            if (!c.active && !c.used && c.type === 'lesson' && c.code?.startsWith('REV-')) {
              try {
                const promoId = c.promoId; // yeni sistemde var
                if (promoId) {
                  await stripe.promotionCodes.update(promoId, { active: true });
                  c.active = true;
                  console.log(`✅ Activated review coupon for ${studentId}: ${c.code}`);
                } else {
                  console.warn(`⚠️ Missing promoId for coupon ${c.code} – cannot activate on Stripe`);
                }
              } catch (err) {
                console.error(`❌ Failed to activate coupon ${c.code}:`, err?.message || err);
              }
            }
            return c;
          }));
        }

        await uref.update({ lessonsTaken, lessonCoupons });
        console.log(`📘 Lesson count updated for ${studentId}: ${lessonsTaken}`);
      }
    }
  }

  return res.status(200).json({ received: true });
}
