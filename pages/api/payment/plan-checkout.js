// pages/api/payment/plan-checkout.js
import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_ID_STARTER,
  pro: process.env.STRIPE_PRICE_ID_PRO,
  vip: process.env.STRIPE_PRICE_ID_VIP,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, userEmail, planKey } = req.body;
  if (!userId || !userEmail || !planKey) return res.status(400).json({ error: 'Missing fields' });

  try {
    const uref = adminDb.collection('users').doc(userId);
    const usnap = await uref.get();
    const user = usnap.exists ? usnap.data() : {};
    const plan = planKey;
    const loyaltyMonths = user?.loyaltyMonths || 0;

    // 🔹 Manuel girilecek kupon (6/12/18 ay) hariç tüm ödemeler normaldir
    let discountPercent = 0;
    let discountReason = '';

    if (plan === 'pro' && loyaltyMonths > 0 && loyaltyMonths % 3 === 0) {
      discountPercent = 10;
      discountReason = 'Pro loyalty 3-month';
    }

    if (plan === 'vip' && loyaltyMonths > 0 && loyaltyMonths % 3 === 0) {
      discountPercent = 20;
      discountReason = 'VIP loyalty 3-month';
    }

    // 🔹 Stripe tek seferlik ödeme
    const amount =
      plan === 'starter' ? 499 :
      plan === 'pro' ? 999 :
      plan === 'vip' ? 1499 : 0;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: `${plan.toUpperCase()} Plan Subscription` },
          unit_amount: amount * 100,
        },
        quantity: 1,
      }],
      allow_promotion_codes: true, // kullanıcı kupon girebilir
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: { bookingType: 'plan', userId, planKey, discountReason },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('plan-checkout error:', err);
    res.status(500).json({ error: 'Checkout failed' });
  }
}
