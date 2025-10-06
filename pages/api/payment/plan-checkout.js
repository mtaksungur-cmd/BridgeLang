import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

const PRICE_AMOUNTS = {
  starter: 499,
  pro: 999,
  vip: 1499,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, userEmail, planKey } = req.body;
  if (!userId || !userEmail || !planKey) return res.status(400).json({ error: 'Missing fields' });

  try {
    const uref = adminDb.collection('users').doc(userId);
    const usnap = await uref.get();
    const user = usnap.exists ? usnap.data() : {};
    const loyaltyMonths = user?.loyaltyMonths || 0;
    const plan = planKey;

    // 🔹 Sadece VIP ve PRO kullanıcılar manuel kupon girebilir
    let discountReason = '';
    if (plan === 'vip' && [6, 12, 18].includes(loyaltyMonths)) {
      discountReason = 'VIP 6/12/18-month manual discount';
    } else if (plan === 'pro' && loyaltyMonths > 0 && loyaltyMonths % 3 === 0) {
      discountReason = 'Pro 3-month loyalty discount';
    }

    const amount = PRICE_AMOUNTS[plan] || 0;
    if (!amount) return res.status(400).json({ error: 'Invalid plan.' });

    // 🔹 Stripe tek seferlik ödeme (manual coupon allowed)
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
      metadata: {
        bookingType: 'plan',
        userId,
        planKey,
        discountReason,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('plan-checkout error:', err);
    res.status(500).json({ error: 'Checkout failed' });
  }
}
