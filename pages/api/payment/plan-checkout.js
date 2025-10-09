// pages/api/payment/plan-checkout.js
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

/* 🔹 Kalan gün oranı hesapla (ör: 15 gün kalmışsa %50) */
function remainingRatio(userData) {
  const sub = userData?.subscription || {};
  const end = sub.activeUntilMillis || 0;
  const now = Date.now();
  if (!end || end < now) return 0;
  const total = 30 * 86400000; // 30 gün
  const remain = Math.max(0, end - now);
  return Math.min(1, remain / total);
}

/* 🔹 Ana handler */
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
    const isUpgrade = PLAN_ORDER.indexOf(planKey) > PLAN_ORDER.indexOf(current);

    /* 🔹 Plan düşürme */
    if (!isUpgrade && current !== planKey && current !== 'free') {
      await ref.set(
        {
          subscription: {
            ...(userData.subscription || {}),
            pending_downgrade_to: planKey,
          },
        },
        { merge: true }
      );

      await sendMail({
        to: userEmail,
        subject: '📅 Downgrade scheduled',
        html: `<p>Your downgrade to <b>${planKey.toUpperCase()}</b> will take effect after your current period.</p>`,
      });

      return res.status(200).json({ message: 'Downgrade scheduled for next period.' });
    }

    const customerId = await getOrCreateCustomer({ userId, userEmail });

    /* 🔹 İlk abonelik (free → X) */
    if (current === 'free') {
      const price = PLAN_PRICES[planKey];
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price_data: { currency: 'gbp', product_data: { name: `${planKey.toUpperCase()} Plan` }, unit_amount: Math.round(price * 100) }, quantity: 1 }],
        metadata: { bookingType: 'subscription_upgrade', userId, upgradeFrom: 'free', upgradeTo: planKey },
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      });
      return res.status(200).json({ url: session.url });
    }

    /* 🔹 Upgrade (ör: starter → pro) */
    if (isUpgrade) {
      const ratio = remainingRatio(userData); // kalan gün oranı
      const currentPrice = PLAN_PRICES[current] || 0;
      const newPrice = PLAN_PRICES[planKey];
      const credit = currentPrice * ratio;
      const diff = Math.max(0, newPrice - credit);

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              product_data: { name: `${planKey.toUpperCase()} Plan (Upgrade)` },
              unit_amount: Math.round(diff * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          bookingType: 'subscription_upgrade',
          userId,
          upgradeFrom: current,
          upgradeTo: planKey,
          diff,
        },
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      });

      return res.status(200).json({ url: session.url });
    }

    /* 🔹 Aynı planı tekrar seçtiyse */
    return res.status(400).json({ error: 'You already have this plan.' });
  } catch (err) {
    console.error('plan-checkout error:', err);
    return res.status(500).json({ error: 'Checkout failed' });
  }
}
