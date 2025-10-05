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

  // 🔹 Sadece 6. dersten sonra kupon üret
  if (lessonsTaken < 6) {
    return res.status(200).json({
      bonusGiven: false,
      message: 'Coupon will activate after 6 lessons.',
    });
  }

  // 🔹 Daha önce kullanılmamış bir yorum kuponu varsa yeniden oluşturma
  const existing = (u.lessonCoupons || []).find(c => !c.used && c.type === 'review');
  if (existing) {
    return res.status(200).json({
      bonusGiven: false,
      message: 'Existing review coupon already available.',
    });
  }

  // 🔹 Kupon oluştur
  const c = await createReviewCoupon(plan);
  if (c) {
    const coupon = { ...c, type: 'review', createdAt: new Date(), used: false };
    await userRef.update({
      lessonCoupons: adminDb.FieldValue.arrayUnion(coupon),
    });
    return res.status(200).json({ bonusGiven: true, coupon });
  }

  res.status(200).json({ bonusGiven: false });
}
