// pages/api/webhook.js
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
  } catch {
    return null;
  }
}

async function createDailyRoom({ teacherId, date, startTime, durationMinutes, timezone }) {
  if (!process.env.DAILY_API_KEY) throw new Error('DAILY_API_KEY missing');

  // Başlangıç saatini UTC epoch seconds olarak hesapla
  const dt = DateTime.fromFormat(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm', { zone: timezone || 'UTC' });
  const startSec = dt.toSeconds();
  const expSec = startSec + (durationMinutes || 60) * 60; // ders süresi kadar açık

  const resp = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `lesson-${teacherId || 't'}-${Date.now()}`,
      properties: {
        nbf: Math.floor(startSec), // oda sadece derste açılır
        exp: Math.floor(expSec),   // dersten sonra kapanır
        enable_screenshare: true,
        enable_chat: true,
        start_video_off: false,
      },
    }),
  });

  const data = await resp.json();
  if (!resp.ok || !data?.url) throw new Error(`Daily API error: ${data?.error || 'unknown'}`);
  return data.url;
}

function addDays(ms, d) { return ms + d * 86400000; }
function now() { return Date.now(); }
function randCode(n = 10) {
  const s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'BL-';
  for (let i = 0; i < n; i++) out += s[Math.floor(Math.random() * s.length)];
  return out;
}

/** VIP’e özel %10 tek kullanımlık promo kodu oluşturur */
async function createVipPromoForCustomer(customerId) {
  // İstersen ürün kısıtlaması eklemek için PRODUCT_ID env’leri ekleyebilirsin (opsiyonel)
  // const appliesTo = [process.env.STRIPE_PRODUCT_ID_STARTER, process.env.STRIPE_PRODUCT_ID_PRO, process.env.STRIPE_PRODUCT_ID_VIP].filter(Boolean);
  const coupon = await stripe.coupons.create({
    percent_off: 10,
    duration: 'once',
    // ...(appliesTo.length ? { applies_to: { products: appliesTo } } : {})
  });
  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: randCode(8),
    max_redemptions: 1,
    customer: customerId,
    active: true,
  });
  return { couponId: coupon.id, promoCode: promo.code };
}

/** Aynı session’ı iki kez işlememek için basit idempotency */
async function markSessionProcessed(userId, sessionId, payload = {}) {
  const ref = adminDb.collection('users').doc(userId).collection('payments').doc(sessionId);
  const snap = await ref.get();
  if (snap.exists) return false;
  await ref.set({ ...payload, createdAt: new Date() });
  return true;
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

  /* ========== 1) Stripe Checkout tamamlandı ========== */
  if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  const meta = session.metadata || {};

  if (meta.bookingType === 'plan') {
    const { userId, planKey } = meta;
    if (!userId || !planKey) return res.status(200).json({ received: true });

    const uref = adminDb.collection('users').doc(userId);
    const usnap = await uref.get();
    const u = usnap.exists ? usnap.data() : {};

    // mevcut süre +30g
    const existed = u?.subscription?.activeUntil?._seconds
      ? u.subscription.activeUntil._seconds * 1000
      : (u?.subscription?.activeUntilMillis || 0);
    const baseMs = Math.max(existed || 0, Date.now());
    const newUntil = baseMs + 30 * 86400000;

    // toplam ödeme sayısını artır
    const lifetime = Number(u?.subscription?.lifetimePayments || 0) + 1;

    // plan hakları reset tablosu
    const PLAN = {
      starter: { credits: 3,  viewLimit: 10,  messagesLeft: 3 },
      pro:     { credits: 6,  viewLimit: 30,  messagesLeft: 10 },
      vip:     { credits: 12, viewLimit: 9999, messagesLeft: 9999 },
    };
    const base = PLAN[planKey] || PLAN.starter;

    // PRO/VIP: her 3. ödemede +1 kredi
    const addBonus = (planKey === 'pro' || planKey === 'vip') && (lifetime % 3 === 0) ? 1 : 0;

    // VIP kodu kullanıldı mı? (bu ödeme sırasında)
    const discountUsed = !!(session.total_details && session.total_details.amount_discount > 0);

    // Mevcut loyalty bilgisi
    let loyalty = u?.subscription?.loyalty || {};

    // Kod KULLANILDIYSA temizle
    if (discountUsed) {
      loyalty = { ...loyalty, promoCode: null, couponId: null, lastPromoUsedAtPayment: lifetime };
    }

    // VIP: her 5., 11., 17. ... ödemeden SONRA yeni kod üret (lifetime % 6 === 5)
    if (planKey === 'vip' && (lifetime % 6 === 5) && session.customer) {
      try {
        // istersen applies_to/products kısıtı ekleyebilirsin
        const coupon = await stripe.coupons.create({ percent_off: 10, duration: 'once' });
        const promo = await stripe.promotionCodes.create({
          coupon: coupon.id,
          code: `BL-${Math.random().toString(36).slice(2,10).toUpperCase()}`,
          max_redemptions: 1,
          customer: session.customer,
          active: true
        });
        loyalty = {
          ...loyalty,
          promoCode: promo.code,
          couponId: coupon.id,
          lastPromoIssuedAtPayment: lifetime
        };
      } catch (e) {
        console.error('vip promo create failed:', e?.message || e);
      }
    }

    // idempotent payment kaydı (opsiyonel)
    try {
      await adminDb.collection('users').doc(userId)
        .collection('payments').doc(session.id)
        .set({
          type: 'plan',
          planKey,
          amount: session.amount_total ? session.amount_total / 100 : null,
          usedPromotionCode: discountUsed,
          createdAt: new Date()
        }, { merge: true });
    } catch {}

    await uref.set({
      subscriptionPlan: planKey,
      credits: base.credits + addBonus,
      viewLimit: base.viewLimit,
      messagesLeft: base.messagesLeft,
      subscription: {
        planKey,
        activeUntil: new Date(newUntil),
        activeUntilMillis: newUntil,
        lastPaymentAt: new Date(),
        lifetimePayments: lifetime,
        loyalty
      }
    }, { merge: true });

    return res.status(200).json({ received: true });
  }


    /* ---- B) DERS ÖDEMESİ (mevcut akış) ---- */
    if (meta.bookingType === 'lesson' || meta.bookingId) {
      const {
        bookingId: metaBookingId,
        teacherId,
        studentId,
        date,
        startTime,
        endTime,
        duration,
        location,
        timezone,
      } = meta;

      const durationMinutes = Number.parseInt(duration, 10) || 60;
      const startAtUtc = toStartAtUtc({ date, startTime, timezone });

      const docId = metaBookingId || session.id;
      const bookingRef = adminDb.collection('bookings').doc(docId);
      const existing = await bookingRef.get();

      let meetingLink = existing.exists ? (existing.data()?.meetingLink || '') : '';
      if (location === 'Online' && !meetingLink) {
        try 
        { 
          meetingLink = await createDailyRoom({
            teacherId,
            date,
            startTime,
            durationMinutes,
            timezone
          }); 
        }
        catch (e) { console.error('Daily create exception (webhook):', e); }
      }

      const payload = {
        teacherId: teacherId || null,
        studentId: studentId || null,
        date: date || null,
        startTime: startTime || null,
        endTime: endTime || null,
        duration: durationMinutes,
        location: location || null,
        meetingLink,
        amountPaid: session.amount_total ? session.amount_total / 100 : null,
        status: 'pending-approval',
        teacherApproved: false,
        studentConfirmed: false,
        reminderSent: false,
        timezone: timezone || null,
        startAtUtc: typeof startAtUtc === 'number' ? startAtUtc : null,
        stripeSessionId: session.id,
        updatedAt: new Date(),
      };

      if (existing.exists) await bookingRef.update(payload);
      else await bookingRef.set({ ...payload, createdAt: new Date() });

      // kredi düş
      try {
        if (studentId) {
          const uref = adminDb.collection('users').doc(studentId);
          const usnap = await uref.get();
          if (usnap.exists) {
            const currentCredits = usnap.data().credits ?? 0;
            await uref.update({ credits: Math.max(currentCredits - 1, 0) });
          }
        }
      } catch (e) {
        console.error('Credit decrement error:', e);
      }

      return res.status(200).json({ received: true });
    }

    /* ---- C) KREDİ SATIN ALIMI (mevcut akış) ---- */
    if (meta.bookingType === 'credits') {
      const { userId, purchasedCredits } = meta;
      if (!userId || !purchasedCredits) return res.status(200).json({ received: true });
      const userRef = adminDb.collection('users').doc(userId);
      const userSnap = await userRef.get();
      if (!userSnap.exists) return res.status(200).json({ received: true });
      const currentCredits = userSnap.data().credits || 0;
      await userRef.update({ credits: currentCredits + Number(purchasedCredits) });
      return res.status(200).json({ received: true });
    }
  }

  /* ========== Not ==========
     Manuel plana geçtiğimiz için aşağıdaki abonelik/fatura event’lerine
     İHTİYAÇ YOK: invoice.payment_succeeded, invoice.upcoming vb.
     (Bilinçli olarak kaldırıldı) */

  return res.status(200).json({ received: true });
}
