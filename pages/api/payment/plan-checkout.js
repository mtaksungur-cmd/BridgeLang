import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, userEmail, planKey } = req.body;
  if (!userId || !userEmail || !planKey) return res.status(400).json({ error: 'Missing fields' });

  try {
    const amount =
      planKey === 'starter' ? 4.99 :
      planKey === 'pro' ? 9.99 :
      planKey === 'vip' ? 14.99 : 0;

    if (!amount) return res.status(400).json({ error: 'Invalid plan' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: `${planKey.toUpperCase()} Plan Subscription (1 month)` },
          unit_amount: amount * 100,
        },
        quantity: 1,
      }],
      // Manuel kupon girişi (yalnızca kullanıcı girerse uygulanır)
      allow_promotion_codes: true,
      customer_email: userEmail || undefined,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: { bookingType: 'plan', userId, planKey },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('plan-checkout error:', err);
    res.status(500).json({ error: 'Checkout failed' });
  }
}
