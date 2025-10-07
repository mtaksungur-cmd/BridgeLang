import Stripe from 'stripe';
import { adminDb } from '../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

function randCode(n = 8) {
  const s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'REV-';
  for (let i = 0; i < n; i++) out += s[Math.floor(Math.random() * s.length)];
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const userRef = adminDb.collection('users').doc(userId);
    const snap = await userRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });

    const u = snap.data() || {};
    const plan = u.subscriptionPlan || 'free';
    const coupons = Array.isArray(u.lessonCoupons) ? u.lessonCoupons : [];

    // 🚫 Eğer lessonCoupons boş değilse (yani kullanıcıda zaten herhangi bir kupon varsa) — yeni kupon oluşturma
    if (coupons.length > 0) {
      console.log(`⚠️ Skipped: User ${userId} already has a lessonCoupons array`);
      return res.status(200).json({ ok: true, skipped: true });
    }

    // 🔹 Plan bazlı indirim yüzdesi
    let percent = 0;
    if (plan === 'starter') percent = 5;
    if (plan === 'pro') percent = 10;
    if (plan === 'vip') percent = 15;
    if (!percent) {
      console.log(`ℹ️ Free user ${userId} — no review bonus generated`);
      return res.status(200).json({ ok: true, message: 'Free plan: no coupon' });
    }

    // 🔹 Stripe kupon + promo code (başlangıçta pasif)
    const coupon = await stripe.coupons.create({
      percent_off: percent,
      duration: 'once',
      name: `${plan} Review Bonus`,
    });

    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: randCode(),
      max_redemptions: 1,
      active: false,
    });

    const newCoupon = {
      code: promo.code,
      promoId: promo.id,
      discount: percent,
      percent: percent,
      active: false,
      used: false,
      type: 'lesson',
      createdAt: new Date(),
    };

    await userRef.update({
      lessonCoupons: FieldValue.arrayUnion(newCoupon),
    });

    console.log(`✅ Review coupon created for ${userId}: ${promo.code} (${percent}%)`);
    return res.status(200).json({ ok: true, coupon: newCoupon });
  } catch (err) {
    console.error('apply-review-bonus error:', err);
    return res.status(500).json({ error: 'Failed to create review bonus' });
  }
}
