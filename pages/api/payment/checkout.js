// pages/api/payment/checkout.js
import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { teacherId, studentId, date, startTime, endTime, duration, location, price, studentEmail, timezone, couponCode } = req.body;

    if (!teacherId || !studentId || !date || !startTime || !duration || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 🔹 Sayısal fiyat kontrolü
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      console.error('❌ Invalid price received:', price);
      return res.status(400).json({ error: 'Invalid or missing price.' });
    }

    let discountedPrice = numericPrice;

    // 🔹 Firestore'dan öğrenci verisini çek
    const uref = adminDb.collection('users').doc(studentId);
    const usnap = await uref.get();

    if (usnap.exists) {
      const u = usnap.data();
      const plan = u?.subscriptionPlan || 'free';
      const totalLessons = u?.lessonsTaken || 0;

      // 🔹 İlk 6 derste indirim uygula
      if (totalLessons < 6) {
        if (plan === 'starter') discountedPrice *= 0.9;
        if (plan === 'pro') discountedPrice *= 0.85;
        if (plan === 'vip') discountedPrice *= 0.8;
      }
    }

    console.log('💰 Final discountedPrice:', discountedPrice);

    // 🔹 Stripe Checkout Session oluştur
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: { name: 'Private Lesson' },
            unit_amount: Math.round(discountedPrice * 100), // ✅ artık kesin sayı
          },
          quantity: 1,
        },
      ],
      customer_email: studentEmail || undefined,
      // 🔹 Kupon desteği
      discounts: couponCode ? [{ coupon: couponCode }] : undefined,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: {
        bookingType: 'lesson',
        teacherId,
        studentId,
        date,
        startTime,
        endTime: endTime || '',
        duration: String(duration),
        location,
        timezone: timezone || '',
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('checkout error:', err);
    return res.status(500).json({ error: 'Checkout init failed' });
  }
}
