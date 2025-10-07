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
    const userSnap = await userRef.get();
    if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });

    const user = userSnap.data();
    const plan = user?.subscriptionPlan || 'free';
    const lessonCoupons = user?.lessonCoupons || [];

    // ➜ Sadece bir kere review kuponu ver (REV- ile başlayan herhangi bir kupon varsa verme)
    if (lessonCoupons.some(c => typeof c?.code === 'string' && c.code.startsWith('REV-'))) {
      console.log(`⚠️ Review coupon already exists for ${userId}`);
      return res.status(200).json({ message: 'Coupon already exists' });
    }

    // Plan bazlı yüzde
    let percent = 0;
    if (plan === 'starter') percent = 5;
    if (plan === 'pro')     percent = 10;
    if (plan === 'vip')     percent = 15;
    if (percent === 0) return res.status(200).json({ message: 'Free users get no coupon' });

    // Stripe kupon + promo code (başta pasif)
    const coupon = await stripe.coupons.create({
      percent_off: percent,
      duration: 'once',
      name: `${plan} Review Bonus`,
    });

    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: randCode(),
      max_redemptions: 1,
      active: false, // 6. dersten sonra aktif edilecek
    });

    const newCoupon = {
      code: promo.code,          // kullanıcıya görünen kod
      promoId: promo.id,         // 🔐 Stripe iç ID (aktivasyon için zorunlu)
      percent,                   // 👈 standarize alan
      discount: percent,         // (geriye dönük uyumluluk)
      active: false,
      used: false,
      type: 'lesson',
      createdAt: new Date(),
    };

    await userRef.update({
      lessonCoupons: FieldValue.arrayUnion(newCoupon),
    });

    console.log(`✅ Review coupon created for ${userId}: ${promo.code} (${percent}%)`);
    return res.status(200).json({ success: true, coupon: newCoupon });
  } catch (err) {
    console.error('apply-review-bonus error:', err);
    return res.status(500).json({ error: 'Failed to create review bonus' });
  }
}
