// pages/api/webhook.js
import { buffer } from 'micro';
import Stripe from 'stripe';
import { adminDb } from '../../lib/firebaseAdmin';
import { DateTime } from 'luxon';

export const config = { api: { bodyParser: false } };
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/** %10 kuponu hazırla (ENV varsa onu kullan, yoksa bir defa oluştur) */
async function ensureTenPercentCouponId() {
  if (process.env.STRIPE_COUPON_ID_10PCT) return process.env.STRIPE_COUPON_ID_10PCT;
  const coupon = await stripe.coupons.create({
    name: 'BridgeLang 10% Loyalty',
    percent_off: 10,
    duration: 'once',
  });
  return coupon.id;
}

/** Müşteriye (veya email’e) göre Firestore kullanıcısını bul */
async function findUserByCustomerOrEmail(customerId, invoice) {
  let snap = await adminDb
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (!snap.empty) {
    return { ref: snap.docs[0].ref, data: snap.docs[0].data() };
  }

  const invEmail =
    invoice?.customer_email ||
    invoice?.customer_details?.email ||
    null;

  if (invEmail) {
    const emailSnap = await adminDb
      .collection('users')
      .where('email', '==', invEmail.toLowerCase())
      .limit(1)
      .get();

    if (!emailSnap.empty) {
      const ref = emailSnap.docs[0].ref;
      const data = emailSnap.docs[0].data();
      await ref.update({ stripeCustomerId: customerId });
      return { ref, data: { ...data, stripeCustomerId: customerId } };
    }
  }
  return { ref: null, data: null };
}

/** Tek kullanımlık promo code oluştur ve Firestore’a yaz */
async function createCustomerPromotionCodeForNextCycle(userRef, userData, customerId) {
  const couponId = await ensureTenPercentCouponId();
  const code = `BRIDGE-10-${(customerId || '').slice(-6).toUpperCase()}`;

  const promo = await stripe.promotionCodes.create({
    coupon: couponId,
    code,
    active: true,
    max_redemptions: 1,
    restrictions: {},
  });

  await userRef.update({
    nextDiscountPromotionCodeId: promo.id,
    nextDiscountPromotionCode: promo.code,
    pendingDiscountForCycle: (userData.subscriptionChargeCount || 0) + 1,
    discountEligible: true,
  });

  return promo;
}

/** TR timezone üzerinden UTC timestamp hesapla (test için) */
function toStartAtUtc({ date, startTime }) {
  try {
    const dt = DateTime.fromFormat(
      `${date} ${startTime}`,
      'yyyy-MM-dd hh:mm a',
      { zone: 'Europe/Istanbul' } // 🔹 Test sürecinde TR zamanı
    );
    if (!dt.isValid) return null;
    return dt.toUTC().toMillis();
  } catch {
    return null;
  }
}

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

  /** 1) Checkout session tamamlandı */
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata || {};

    if (meta.bookingType === 'lesson') {
      const { teacherId, studentId, date, startTime, endTime, duration, location, meetingLink } = meta;
      if (!teacherId || !studentId || !date) {
        console.error('Missing booking metadata', meta);
        return res.status(400).json({ error: 'Missing booking metadata' });
      }

      const startAtUtc = toStartAtUtc({ date, startTime });

      // 🔹 Rezervasyonu ekle
      await adminDb.collection('bookings').add({
        teacherId,
        studentId,
        date,
        startTime,
        endTime,
        duration,
        location,
        meetingLink: meetingLink || '',
        amountPaid: session.amount_total ? session.amount_total / 100 : null,
        status: 'pending-approval',
        teacherApproved: false,
        studentConfirmed: false,
        createdAt: new Date(),
        startAtUtc,
        reminderSent: false,
      });

      // 🔹 Kredi eksiltme
      const userRef = adminDb.collection('users').doc(studentId);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        const currentCredits = userSnap.data().credits || 0;
        await userRef.update({ credits: Math.max(currentCredits - 1, 0) });
        console.log(`✅ 1 kredi düşüldü: ${studentId}`);
      }

      console.log('✅ Booking created & credit deducted for session:', session.id);
    }

    else if (meta.bookingType === 'subscription') {
      const { userId, planKey } = meta;
      if (!userId || !planKey) {
        console.error('Missing subscription metadata', meta);
        return res.status(400).json({ error: 'Missing subscription metadata' });
      }

      let updates = {
        subscriptionPlan: planKey,
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
      };
      if (planKey === 'starter') updates = { ...updates, credits: 3, viewLimit: 10, messagesLeft: 3 };
      else if (planKey === 'pro') updates = { ...updates, credits: 6, viewLimit: 30, messagesLeft: 10 };
      else if (planKey === 'vip') updates = { ...updates, credits: 12, viewLimit: 9999, messagesLeft: 9999 };

      const userRef = adminDb.collection('users').doc(userId);
      const userSnap = await userRef.get();
      let extra = {};
      if (!userSnap.exists || !userSnap.data().subscriptionStartedAt) {
        extra = { subscriptionStartedAt: new Date(), subscriptionChargeCount: 0 };
      }
      await userRef.update({ ...updates, ...extra });
      console.log(`✅ Subscription activated for user ${userId}: ${planKey}`);
    }

    else if (meta.bookingType === 'credits') {
      const { userId, purchasedCredits } = meta;
      if (!userId || !purchasedCredits) {
        console.error('Missing credit purchase metadata', meta);
        return res.status(400).json({ error: 'Missing credit purchase metadata' });
      }
      const userRef = adminDb.collection('users').doc(userId);
      const userSnap = await userRef.get();
      if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });
      const currentCredits = userSnap.data().credits || 0;
      await userRef.update({ credits: currentCredits + Number(purchasedCredits) });
      console.log(`✅ Added ${purchasedCredits} credits to user ${userId}`);
    }
  }

  /** 2) Her başarılı abonelik ödemesi */
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;

    if (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_threshold') {
      const customerId = invoice.customer;
      const { ref: uref, data: u } = await findUserByCustomerOrEmail(customerId, invoice);
      if (!uref || !u) {
        console.warn('invoice.payment_succeeded: user not found for customer', customerId);
      } else {
        const current = (u.subscriptionChargeCount || 0) + 1;
        await uref.update({ subscriptionChargeCount: current });

        if (current % 5 === 0) {
          await createCustomerPromotionCodeForNextCycle(uref, { ...u, subscriptionChargeCount: current }, customerId);
          console.log(`🎁 Created promotion code for next cycle (user ${uref.id})`);
        }
      }
    }
  }

  /** 3) Fatura kesilmeden hemen önce indirim uygula */
  if (event.type === 'invoice.upcoming') {
    const invoice = event.data.object;
    const customerId = invoice.customer;

    const { ref: uref, data: u } = await findUserByCustomerOrEmail(customerId, invoice);
    if (!uref || !u) {
      console.warn('invoice.upcoming: user not found for customer', customerId);
    } else {
      if (u.nextDiscountPromotionCodeId) {
        try {
          await stripe.invoices.update(invoice.id, {
            discounts: [{ promotion_code: u.nextDiscountPromotionCodeId }],
          });

          await uref.update({
            nextDiscountPromotionCodeId: null,
            nextDiscountPromotionCode: null,
            pendingDiscountForCycle: null,
            discountEligible: false,
            lastDiscountUsedAt: new Date(),
            discountUsedCount: (u.discountUsedCount || 0) + 1,
          });

          console.log(`✅ Applied promotion code to upcoming invoice ${invoice.id} (user ${uref.id})`);
        } catch (e) {
          console.error('Failed to apply promotion code to upcoming invoice:', e.message || e);
        }
      }
    }
  }

  res.status(200).json({ received: true });
}
