import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { teacherId, studentId, date, startTime, endTime, duration, location, price, studentEmail, timezone, couponCode } = req.body;

    if (!teacherId || !studentId || !date || !startTime || !duration || !location)
      return res.status(400).json({ error: 'Missing required fields' });

    const userRef = adminDb.collection('users').doc(studentId);
    const userSnap = await userRef.get();

    let discountedPrice = Number(price);
    let appliedCoupon = null;

    if (userSnap.exists) {
      const userData = userSnap.data();
      const plan = userData.subscriptionPlan || 'free';
      const totalLessons = userData.lessonsTaken || 0;

      // 🔹 İlk 6 derste abonelik indirimi
      if (totalLessons < 6) {
        if (plan === 'starter') discountedPrice *= 0.9;
        if (plan === 'pro') discountedPrice *= 0.85;
        if (plan === 'vip') discountedPrice *= 0.8;
      }

      // 🔹 Firestore kupon kodu kontrolü
      if (couponCode) {
        const coupons = userData.lessonCoupons || [];
        const match = coupons.find(c => c.code === couponCode && !c.used);
        if (match) {
          discountedPrice -= (discountedPrice * match.discount) / 100;
          appliedCoupon = match.code;

          // kuponu used yap
          const updatedCoupons = coupons.map(c =>
            c.code === match.code ? { ...c, used: true } : c
          );
          await userRef.update({ lessonCoupons: updatedCoupons });
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: { name: 'Private Lesson' },
            unit_amount: Math.round(discountedPrice * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: studentEmail || undefined,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: { teacherId, studentId, date, startTime, endTime, duration, location, timezone, appliedCoupon },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('checkout error:', err);
    return res.status(500).json({ error: 'Checkout init failed' });
  }
}
