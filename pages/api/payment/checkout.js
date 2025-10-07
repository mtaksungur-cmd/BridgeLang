import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';

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

    let discountedPrice = numericPrice;
    let discountLabel   = 'No discount';
    let couponToMarkUsedIndex = -1;

    // 🔹 Öğrenciyi ve kuponlarını oku
    const uRef  = adminDb.collection('users').doc(studentId);
    const uSnap = await uRef.get();

    if (uSnap.exists) {
      const user = uSnap.data();
      const plan = user?.subscriptionPlan || 'free';
      const totalLessons = user?.lessonsTaken || 0;
      const lessonCoupons = Array.isArray(user?.lessonCoupons) ? user.lessonCoupons : [];

      // 1) İlk 6 ders indirimleri
      if (totalLessons < 6) {
        if (plan === 'starter') discountedPrice *= 0.9,  discountLabel = 'Starter 10% (first 6 lessons)';
        if (plan === 'pro')     discountedPrice *= 0.85, discountLabel = 'Pro 15% (first 6 lessons)';
        if (plan === 'vip')     discountedPrice *= 0.8,  discountLabel = 'VIP 20% (first 6 lessons)';
      } else {
        // 2) 6. dersten sonra aktif + kullanılmamış review kuponu varsa uygula
        const idx = lessonCoupons.findIndex(c => c.active === true && c.used !== true && c.type === 'lesson');
        if (idx >= 0) {
          const c = lessonCoupons[idx];
          const pct = typeof c.percent === 'number' ? c.percent :
                      typeof c.discount === 'number' ? c.discount : 0;
          if (pct > 0) {
            discountedPrice *= (1 - pct / 100);
            discountLabel = `Auto Coupon ${pct}%`;
            couponToMarkUsedIndex = idx;
          }
        }
      }
    }

    // 🔹 Stripe Checkout
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

    // 🔹 Kuponu "used" olarak işaretle (arrayReplace mantığı)
    if (couponToMarkUsedIndex >= 0) {
      const freshSnap = await uRef.get();
      const u = freshSnap.exists ? freshSnap.data() : {};
      const list = Array.isArray(u.lessonCoupons) ? [...u.lessonCoupons] : [];
      if (list[couponToMarkUsedIndex] && list[couponToMarkUsedIndex].active === true) {
        list[couponToMarkUsedIndex].used = true;
        await uRef.update({ lessonCoupons: list });
      }
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('checkout error:', err);
    return res.status(500).json({ error: 'Checkout init failed' });
  }
}
