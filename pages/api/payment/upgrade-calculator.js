// pages/api/payment/upgrade-calculator.js
import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

// plan ücretleri (sabit değer, Stripe'taki aylık fiyatlara göre)
const PRICE_MAP = {
  starter: 4.99,
  pro: 9.99,
  vip: 14.99,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, newPlan } = req.body;
  if (!userId || !newPlan)
    return res.status(400).json({ error: 'Missing fields' });

  try {
    // Firestore'dan kullanıcı verisini çek
    const uref = adminDb.collection('users').doc(userId);
    const snap = await uref.get();
    if (!snap.exists)
      return res.status(404).json({ error: 'User not found' });
    const data = snap.data();

    const currentPlan = data.subscriptionPlan || 'free';
    const currentEnd = data.subscription?.activeUntilMillis || Date.now();
    const lastPaymentAt = data.subscription?.lastPaymentAt?.toMillis?.() || Date.now();

    // süre hesaplama
    const totalDays = 30;
    const usedDays = Math.min(
      (Date.now() - lastPaymentAt) / (1000 * 60 * 60 * 24),
      totalDays
    );
    const remainingRatio = Math.max(0, 1 - usedDays / totalDays);

    const oldPrice = PRICE_MAP[currentPlan] || 0;
    const newPrice = PRICE_MAP[newPlan];
    const diff = Math.max(0, newPrice - oldPrice);
    const payable = Number((diff * remainingRatio).toFixed(2));

    if (payable <= 0)
      return res.status(400).json({ error: 'No difference to charge' });

    // Stripe one-off ödeme oturumu oluştur
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: { name: `Upgrade from ${currentPlan} → ${newPlan}` },
            unit_amount: Math.round(payable * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        upgradeFrom: currentPlan,
        upgradeTo: newPlan,
        payable,
        bookingType: 'subscription_upgrade',
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
    });

    return res.status(200).json({ url: session.url, payable });
  } catch (err) {
    console.error('🔥 upgrade-calculator error:', err);
    res.status(500).json({ error: 'Upgrade failed' });
  }
}
