// pages/api/apply-review-bonus.js
import { adminDb } from '../../lib/firebaseAdmin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

function randCode(n = 8) {
  const s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'REV-';
  for (let i = 0; i < n; i++) out += s[Math.floor(Math.random() * s.length)];
  return out;
}

async function createReviewCoupon(plan) {
  let percent = 0;
  if (plan === 'starter') percent = 5;
  if (plan === 'pro') percent = 10;
  if (plan === 'vip') percent = 15;
  if (!percent) return null;

  const coupon = await stripe.coupons.create({
    percent_off: percent,
    duration: 'once',
  });

  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: randCode(),
    max_redemptions: 1,
    active: true,
    metadata: { type: 'review_bonus' }
  });

  return { code: promo.code, discount: percent };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const userRef = adminDb.collection('users').doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return res.status(404).json({ error: "User not found" });

  const u = userSnap.data();
  const plan = u.subscriptionPlan || 'free';
  const lessonsTaken = u.lessonsTaken || 0;

  // 🔹 Önceden bir yorum kuponu varsa tekrar oluşturma
  const existing = (u.lessonCoupons || []).find(c => c.type === 'review');
  if (existing) {
    return res.status(200).json({
      bonusGiven: false,
      message: 'Review coupon already exists.',
    });
  }

  // 🔹 Kupon oluştur
  const c = await createReviewCoupon(plan);
  if (c) {
    const coupon = {
      ...c,
      type: 'review',
      createdAt: new Date(),
      used: false,
      active: lessonsTaken >= 6, // 🔸 6. dersten önce aktif değil
    };

    await userRef.update({
      lessonCoupons: adminDb.FieldValue.arrayUnion(coupon),
    });

    return res.status(200).json({
      bonusGiven: true,
      coupon,
      active: coupon.active,
      message: coupon.active
        ? 'Coupon is active and ready to use.'
        : 'Coupon created but will activate after your 6th lesson.',
    });
  }

  res.status(200).json({ bonusGiven: false });
}
