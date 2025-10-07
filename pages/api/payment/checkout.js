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
    if (!Number.isFinite(numericPrice) || numericPrice <= 0)
      return res.status(400).json({ error: 'Invalid or missing price.' });

    let discountedPrice = numericPrice;
    let discountLabel = 'No discount';
    let usedCoupon = null;

    const uSnap = await adminDb.collection('users').doc(studentId).get();
    if (uSnap.exists) {
      const user = uSnap.data();
      const plan = user?.subscriptionPlan || 'free';
      const totalLessons = user?.lessonsTaken || 0;
      const lessonCoupons = user?.lessonCoupons || [];

      // 1) ilk 6 derste plan indirimi
      if (totalLessons < 6) {
        if (plan === 'starter') { discountedPrice *= 0.90; discountLabel = 'Starter 10% (first 6 lessons)'; }
        if (plan === 'pro')     { discountedPrice *= 0.85; discountLabel = 'Pro 15% (first 6 lessons)'; }
        if (plan === 'vip')     { discountedPrice *= 0.80; discountLabel = 'VIP 20% (first 6 lessons)'; }
      } else {
        // 2) 6. dersten sonra aktif review kuponu varsa uygula
        const activeCoupon = lessonCoupons.find(c => c.active === true && !c.used);
        if (activeCoupon) {
          const pct = (activeCoupon.discount ?? activeCoupon.percent ?? 0);
          if (pct > 0) {
            discountedPrice *= (1 - pct / 100);
            discountLabel = `Auto Coupon ${pct}%`;
            usedCoupon = activeCoupon;
          }
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: 'Private Lesson' },
          unit_amount: Math.round(discountedPrice * 100),
        },
        quantity: 1,
      }],
      customer_email: studentEmail || undefined,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: {
        bookingType: 'lesson',
        teacherId, studentId, date, startTime, endTime: endTime || '',
        duration: String(duration), location, timezone: timezone || '',
        discountLabel,
      },
    });

    // kuponu "used" olarak işaretle (array remove + add)
    if (usedCoupon) {
      await adminDb.collection('users').doc(studentId).update({
        lessonCoupons: admin.firestore.FieldValue.arrayRemove(usedCoupon),
      });
      usedCoupon.used = true;
      await adminDb.collection('users').doc(studentId).update({
        lessonCoupons: admin.firestore.FieldValue.arrayUnion(usedCoupon),
      });
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('checkout error:', err);
    return res.status(500).json({ error: 'Checkout init failed' });
  }
}
