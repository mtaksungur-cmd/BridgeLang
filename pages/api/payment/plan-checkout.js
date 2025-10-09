// pages/api/payment/plan-checkout.js
import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

const PRICE_MAP = {
  starter: process.env.STRIPE_PRICE_ID_STARTER,
  pro: process.env.STRIPE_PRICE_ID_PRO,
  vip: process.env.STRIPE_PRICE_ID_VIP,
};

const PLAN_ORDER = ['free', 'starter', 'pro', 'vip'];

async function getOrCreateCustomer({ userId, userEmail }) {
  const uref = adminDb.collection('users').doc(userId);
  const snap = await uref.get();
  const data = snap.exists ? snap.data() : {};
  let customerId = data?.stripe?.customerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId },
    });
    customerId = customer.id;
    await uref.set({ stripe: { ...(data.stripe || {}), customerId } }, { merge: true });
  }
  return customerId;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, userEmail, planKey, currentPlan } = req.body;
  if (!userId || !userEmail || !planKey)
    return res.status(400).json({ error: 'Missing fields' });

  try {
    const priceId = PRICE_MAP[planKey];
    const uref = adminDb.collection('users').doc(userId);
    const usnap = await uref.get();
    const udata = usnap.exists ? usnap.data() : {};
    const current = currentPlan || udata.subscriptionPlan || 'free';

    // 🔹 yeni sistem: upgrade durumunda one-off ödeme API'sine yönlendir
    const isUpgrade = PLAN_ORDER.indexOf(planKey) > PLAN_ORDER.indexOf(current);
    if (isUpgrade && current !== 'free') {
      const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/upgrade-calculator`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPlan: planKey }),
      });
      const data = await response.json();
      if (data.url) return res.status(200).json({ url: data.url });
      else return res.status(400).json({ error: data.error || 'Upgrade failed' });
    }

    // 🔻 free → ilk abonelik veya downgrade flow (mevcut mantık korunuyor)
    const customerId = await getOrCreateCustomer({ userId, userEmail });
    const subscriptionId = udata?.stripe?.subscriptionId || null;
    const itemId = udata?.stripe?.subscriptionItemId || null;

    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    if (subscriptionId && itemId) {
      // Dönem sonunda downgrade planla
      const sub = udata.subscription || {};
      await uref.set({
        subscription: { ...sub, pending_downgrade_to: planKey },
      }, { merge: true });

      await sendMail({
        to: userEmail,
        subject: '📅 Subscription downgrade scheduled',
        html: `
          <p>Hello,</p>
          <p>Your downgrade to the <b>${planKey.toUpperCase()}</b> plan will take effect at the end of your current billing cycle.</p>
          <p>No refunds are issued for early downgrades.</p>
          <p>— BridgeLang Team</p>
        `,
      });

      return res.status(200).json({ message: 'Downgrade scheduled.' });
    }

    // İlk abonelik (free → X)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { metadata: { userId, planKey } },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: { bookingType: 'subscription_start', userId, planKey },
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('plan-checkout error:', err);
    res.status(500).json({ error: 'Checkout failed' });
  }
}
