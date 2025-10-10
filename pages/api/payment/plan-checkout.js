import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

/* ------- Sabit fiyatlar ve plan sırası -------- */
const PLAN_PRICES = { starter: 4.99, pro: 9.99, vip: 14.99 };
const PLAN_ORDER  = ['free', 'starter', 'pro', 'vip'];
const PLAN_LIMITS = {
  free:    { viewLimit: 10,  messagesLeft: 3  },
  starter: { viewLimit: 30,  messagesLeft: 8  },
  pro:     { viewLimit: 60,  messagesLeft: 20 },
  vip:     { viewLimit: 9999, messagesLeft: 9999 },
};

/* ------- Firestore müşteri id helper -------- */
async function getOrCreateCustomer({ userId, userEmail }) {
  const ref  = adminDb.collection('users').doc(userId);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : {};
  let customerId = data?.stripe?.customerId;

  if (!customerId) {
    const c = await stripe.customers.create({ email: userEmail, metadata: { userId } });
    customerId = c.id;
    await ref.set({ stripe: { ...(data.stripe || {}), customerId } }, { merge: true });
  }
  return customerId;
}

/* ------- Güne bölme: kalan oran -------- */
function calcRemainingRatio(subscription) {
  const last =
    subscription?.lastPaymentAt?.toMillis?.() ||
    Date.parse(subscription?.lastPaymentAt) ||
    0;
  if (!last) return 0;
  const now = Date.now();
  const elapsedDays = Math.max(0, Math.floor((now - last) / (1000 * 60 * 60 * 24)));
  const remaining   = Math.max(0, 30 - elapsedDays);
  return Math.min(1, remaining / 30);
}

/* ------- VIP sadakat kuponu (6/12/18...) -------- */
async function createVipLoyaltyCouponForNextPayment({ userId, nextPaymentNo }) {
  if (nextPaymentNo % 6 !== 0) return null;
  const coupon = await stripe.coupons.create({
    percent_off: 10,
    duration: 'once',
    name: `VIP Loyalty — Payment #${nextPaymentNo}`,
  });
  return coupon.id;
}

/* --------------- Handler ---------------- */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, userEmail, planKey, currentPlan } = req.body;
  if (!userId || !userEmail || !planKey)
    return res.status(400).json({ error: 'Missing fields' });

  try {
    const ref   = adminDb.collection('users').doc(userId);
    const snap  = await ref.get();
    const udata = snap.exists ? snap.data() : {};
    const current   = currentPlan || udata.subscriptionPlan || 'free';
    const sub       = udata.subscription || {};
    const isUpgrade = PLAN_ORDER.indexOf(planKey) > PLAN_ORDER.indexOf(current);
    const customerId = await getOrCreateCustomer({ userId, userEmail });

    /* ---------- DOW N G R A D E ---------- */
    if (!isUpgrade && current !== planKey && current !== 'free') {

      // 🔹 aktif süresi devam ediyorsa uyarı döndür
      if (sub.activeUntilMillis && sub.activeUntilMillis > Date.now()) {
        return res.status(400).json({
          error: 'You can change your plan after your current subscription period ends.',
        });
      }

      // 🔹 aktif süresi bittiyse downgrade yap
      await ref.set({
        subscription: {
          ...(sub || {}),
          planKey,
          pending_downgrade_to: null,
          activeUntil: null,
          activeUntilMillis: null,
          lifetimePayments: 1,
        },
        subscriptionPlan: planKey,
      }, { merge: true });

      console.log(`✅ Downgrade applied immediately: ${current} → ${planKey}`);
      return res.status(200).json({ message: 'Downgrade applied successfully.' });
    }

    /* ---------- AYNI PLAN (YENİLEME) ---------- */
    if (current === planKey) {
      const expired = !sub.activeUntilMillis || sub.activeUntilMillis < Date.now();
      if (!expired) return res.status(400).json({ error: 'You already have this active plan.' });

      const price = PLAN_PRICES[planKey];
      const nextPaymentNo = (sub.lifetimePayments || 0) + 1;
      const discounts = [];
      let appliedVipCouponId = null;

      if (planKey === 'vip') {
        const vipCouponId = await createVipLoyaltyCouponForNextPayment({ userId, nextPaymentNo });
        if (vipCouponId) {
          discounts.push({ coupon: vipCouponId });
          appliedVipCouponId = vipCouponId;
        }
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customerId,
        payment_method_types: ['card'],
        ...(discounts.length ? { discounts } : { allow_promotion_codes: true }),
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { name: `${planKey.toUpperCase()} Plan (Renewal)` },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        }],
        metadata: {
          bookingType: 'subscription_upgrade',
          userId,
          upgradeFrom: planKey,
          upgradeTo: planKey,
          payable: price,
          vipAppliedCouponId: appliedVipCouponId || '',
          vipNextPaymentNo: String(nextPaymentNo),
          renewal: '1',
        },
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      });
      return res.status(200).json({ url: session.url });
    }

    /* ---------- İLK ABONELİK (FREE → X) ---------- */
    if (current === 'free') {
      const price = PLAN_PRICES[planKey];
      const base = PLAN_LIMITS[planKey] || PLAN_LIMITS.free;
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customerId,
        payment_method_types: ['card'],
        allow_promotion_codes: true,
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { name: `${planKey.toUpperCase()} Plan` },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        }],
        metadata: {
          bookingType: 'subscription_upgrade',
          userId,
          upgradeFrom: 'free',
          upgradeTo: planKey,
          payable: price,
          renewal: '0',
          viewLimit: base.viewLimit,
          messagesLeft: base.messagesLeft,
        },
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      });
      return res.status(200).json({ url: session.url });
    }

    /* ---------- U P G R A D E ---------- */
    if (isUpgrade) {
      const ratio        = calcRemainingRatio(sub);
      const currentPrice = PLAN_PRICES[current] || 0;
      const newPrice     = PLAN_PRICES[planKey];
      const credit       = currentPrice * ratio;
      const payable      = Math.max(0, newPrice - credit);
      const base         = PLAN_LIMITS[planKey] || PLAN_LIMITS.free;

      await ref.set({ subscription: { ...(sub || {}), lifetimePayments: 1 } }, { merge: true });

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customerId,
        payment_method_types: ['card'],
        allow_promotion_codes: true,
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { name: `${planKey.toUpperCase()} Plan (Upgrade)` },
            unit_amount: Math.round(payable * 100),
          },
          quantity: 1,
        }],
        metadata: {
          bookingType: 'subscription_upgrade',
          userId,
          upgradeFrom: current,
          upgradeTo: planKey,
          payable,
          renewal: '0',
          viewLimit: base.viewLimit,
          messagesLeft: base.messagesLeft,
        },
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      });
      return res.status(200).json({ url: session.url });
    }

    return res.status(400).json({ error: 'Invalid plan change request.' });
  } catch (err) {
    console.error('plan-checkout error:', err);
    return res.status(500).json({ error: 'Checkout failed' });
  }
}
