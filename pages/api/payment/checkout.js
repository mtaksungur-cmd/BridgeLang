// pages/api/payment/checkout.js
import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { teacherId, studentId, date, startTime, endTime, duration, location, price, studentEmail, timezone, couponCode } = req.body;

    if (!teacherId || !studentId || !date || !startTime || !duration || !location)
      return res.status(400).json({ error: 'Missing required fields' });

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice <= 0)
      return res.status(400).json({ error: 'Invalid or missing price.' });

    let discountedPrice = numericPrice;
    let discountLabel = 'No discount';
    let validCoupon = null;

    // 🔹 Öğrenci verisini Firestore'dan al
    const uSnap = await adminDb.collection('users').doc(studentId).get();
    if (uSnap.exists) {
      const u = uSnap.data();
      const plan = u?.subscriptionPlan || 'free';
      const totalLessons = u?.lessonsTaken || 0;

      // 1️⃣ İlk 6 ders indirimi
      if (totalLessons < 6) {
        if (plan === 'starter') discountedPrice *= 0.9, discountLabel = 'Starter 10% first 6 lessons';
        if (plan === 'pro') discountedPrice *= 0.85, discountLabel = 'Pro 15% first 6 lessons';
        if (plan === 'vip') discountedPrice *= 0.8, discountLabel = 'VIP 20% first 6 lessons';
      }

      // 2️⃣ Kullanıcının yorum sonrası veya sadakat kuponu varsa
      const lessonCoupons = (u.lessonCoupons || []).filter(c => !c.used);
      const found = lessonCoupons.find(c => c.code === couponCode);
      if (found) {
        discountedPrice *= (1 - found.discount / 100);
        validCoupon = found;
        discountLabel = `Coupon ${found.discount}%`;
      }
    }

    // 🔹 Stripe Checkout session
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
        discountLabel,
      },
    });

    // 🔹 Kullanılmış kuponu Firestore’da işaretle
    if (validCoupon) {
      await adminDb.collection('users').doc(studentId).update({
        lessonCoupons: adminDb.FieldValue.arrayRemove(validCoupon),
      });
      validCoupon.used = true;
      await adminDb.collection('users').doc(studentId).update({
        lessonCoupons: adminDb.FieldValue.arrayUnion(validCoupon),
      });
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('checkout error:', err);
    return res.status(500).json({ error: 'Checkout init failed' });
  }
}
