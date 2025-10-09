import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

const PLAN_PRICES = { starter: 4.99, pro: 9.99, vip: 14.99 };
const PLAN_ORDER = ['free', 'starter', 'pro', 'vip'];

/* 🔹 Firestore'dan kullanıcıyı getir veya oluştur */
async function getOrCreateCustomer({ userId, userEmail }) {
  const ref = adminDb.collection('users').doc(userId);
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

/* 🔹 Kalan gün oranı (tam tarih bazlı) */
function calcRemainingRatio(subscription) {
  const lastPayment = subscription?.lastPaymentAt?.toMillis?.() || Date.parse(subscription?.lastPaymentAt) || 0;
  const now = Date.now();
  if (!lastPayment) return 0;
  const elapsedDays = Math.floor((now - lastPayment) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, 30 - elapsedDays);
  return Math.min(1, remainingDays / 30);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, userEmail, planKey, currentPlan } = req.body;

  if (!userId || !userEmail || !planKey)
    return res.status(400).json({ error: 'Missing fields' });

  try {
    const ref = adminDb.collection('users').doc(userId);
    const snap = await ref.get();
    const userData = snap.exists ? snap.data() : {};
    const current = currentPlan || userData.subscriptionPlan || 'free';
    const sub = userData.subscription || {};
    const isUpgrade = PLAN_ORDER.indexOf(planKey) > PLAN_ORDER.indexOf(current);
    const customerId = await getOrCreateCustomer({ userId, userEmail });

    /* 🔹 Plan düşürme */
    if (!isUpgrade && current !== planKey && current !== 'free') {
      await ref.set({
        subscription: {
          ...(userData.subscription || {}),
          pending_downgrade_to: planKey,
        },
      }, { merge: true });

      await sendMail({
        to: userEmail,
        subject: '📅 Downgrade scheduled',
        html: `<p>Your downgrade to <b>${planKey.toUpperCase()}</b> will take effect after your current billing cycle.</p>`,
      });

      return res.status(200).json({ message: 'Downgrade scheduled for next period.' });
    }

    /* 🔹 İlk abonelik (free → X) */
    if (current === 'free') {
      const price = PLAN_PRICES[planKey];
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
        metadata: { userId, upgradeFrom: 'free', upgradeTo: planKey, bookingType: 'subscription_upgrade' },
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      });
      return res.status(200).json({ url: session.url });
    }

    /* 🔹 Upgrade (ör: pro → vip) */
    if (isUpgrade) {
      const remainingRatio = calcRemainingRatio(sub);
      const currentPrice = PLAN_PRICES[current] || 0;
      const newPrice = PLAN_PRICES[planKey];
      const credit = currentPrice * remainingRatio;
      const payable = Math.max(0, newPrice - credit);

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customerId,
        payment_method_types: ['card'],
        allow_promotion_codes: true, // 🎁 kupon girişi aktif
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { name: `${planKey.toUpperCase()} Plan (Upgrade)` },
            unit_amount: Math.round(payable * 100),
          },
          quantity: 1,
        }],
        metadata: {
          userId,
          upgradeFrom: current,
          upgradeTo: planKey,
          payable,
          bookingType: 'subscription_upgrade',
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
