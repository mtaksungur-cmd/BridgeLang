import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';
import admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const {
      teacherId, studentId, date, startTime, endTime,
      duration, location, price, studentEmail, timezone
    } = req.body;

    if (!teacherId || !studentId || !date || !startTime || !duration || !location)
      return res.status(400).json({ error: 'Missing required fields' });

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice <= 0)
      return res.status(400).json({ error: 'Invalid or missing price.' });

    // ---- pricing & discounts ----
    const originalPrice = numericPrice;
    let discountedPrice = originalPrice;
    let discountLabel = 'No discount';
    let discountPercent = 0;
    let usedCoupon = null;

    // 🔹 Öğrenci verisi
    const uSnap = await adminDb.collection('users').doc(studentId).get();
    if (uSnap.exists) {
      const user = uSnap.data();
      const plan = user?.subscriptionPlan || 'free';
      const totalLessons = user?.lessonsTaken || 0;
      const lessonCoupons = Array.isArray(user?.lessonCoupons) ? user.lessonCoupons : [];

      // 1) İlk 6 ders indirimi
      if (totalLessons < 6) {
        if (plan === 'starter') { discountedPrice *= 0.9;  discountLabel = 'Starter 10% (first 6 lessons)'; discountPercent = 10; }
        if (plan === 'pro')     { discountedPrice *= 0.85; discountLabel = 'Pro 15% (first 6 lessons)';     discountPercent = 15; }
        if (plan === 'vip')     { discountedPrice *= 0.8;  discountLabel = 'VIP 20% (first 6 lessons)';     discountPercent = 20; }
      } else {
        // 2) Aktif DERS kuponu (review + 3x loyalty) otomatik uygula
        const activeCoupon = lessonCoupons.find(c => c.type === 'lesson' && c.active === true && !c.used);
        if (activeCoupon) {
          const pct = Number(activeCoupon.percent ?? activeCoupon.discount ?? 0);
          if (pct > 0) {
            discountedPrice = originalPrice * (1 - pct / 100);
            discountLabel = `Auto Lesson Coupon ${pct}%`;
            discountPercent = pct;
            usedCoupon = activeCoupon;
          }
        }
      }
    }

    // kuruş/cents çalış
    const originalUnitAmount = Math.round(originalPrice * 100);
    const discountedUnitAmount = Math.max(0, Math.round(discountedPrice * 100));

    // 🔹 Stripe payment session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: 'Private Lesson' },
          unit_amount: discountedUnitAmount,
        },
        quantity: 1,
      }],
      customer_email: studentEmail || undefined,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      // 👇 booking’e yazmak için gerekli tüm datayı metadata’ya koyuyoruz
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
        discountPercent: String(discountPercent || 0),
        original_unit_amount: String(originalUnitAmount),   // cents
        discounted_unit_amount: String(discountedUnitAmount), // cents
        // takip için (varsa)
        coupon_code: usedCoupon?.code || '',
        coupon_type: usedCoupon?.type || '',
      },
    });

    console.log('STRIPE SESSION:', {
      id: session.id,
      url: session.url,
      checkout_url: session.checkout_url,
    });

    // 🔹 Kuponu "used" işaretle (yalnız ders-kuponları)
    if (usedCoupon) {
      await adminDb.collection('users').doc(studentId).update({
        lessonCoupons: admin.firestore.FieldValue.arrayRemove(usedCoupon),
      });
      usedCoupon.used = true;
      await adminDb.collection('users').doc(studentId).update({
        lessonCoupons: admin.firestore.FieldValue.arrayUnion(usedCoupon),
      });
    }

    return res.status(200).json({
      url: session.url || session.checkout_url
    });
  } catch (err) {
    console.error('checkout error:', err);
    return res.status(500).json({ error: 'Checkout init failed' });
  }
}
