// pages/api/reviews/[lessonId].js
import { adminDb } from '../../../lib/firebaseAdmin';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import Stripe from 'stripe';
import { isInappropriate } from '../../../lib/messageFilter';
import { updateBadgesForTeacher } from '../../../lib/badgeUtilsServer';
import { sendMail } from '../../../lib/mailer';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { lessonId } = req.query;
  const { rating, comment } = req.body;

  if (!lessonId || !rating || typeof rating !== 'number') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  if (comment && isInappropriate(comment)) {
    return res.status(400).json({ error: 'Inappropriate comment content' });
  }

  try {
    const bookingSnap = await adminDb.collection('bookings').doc(lessonId).get();
    if (!bookingSnap.exists) return res.status(404).end();
    const booking = bookingSnap.data();
    if (booking.status !== 'approved') {
      return res.status(403).json({ error: 'Lesson not approved yet' });
    }

    const teacherId = booking.teacherId;
    const studentId = booking.studentId;

    // 🔹 Yorumu kaydet
    await adminDb.collection('reviews').doc(lessonId).set({
      lessonId,
      teacherId,
      studentId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    });

    // 🔹 Öğretmen ortalama puanını güncelle
    const rSnap = await adminDb.collection('reviews').where('teacherId', '==', teacherId).get();
    const all = rSnap.docs.map(d => d.data());
    const total = all.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avg = all.length > 0 ? total / all.length : 0;

    await adminDb.collection('users').doc(teacherId).update({
      avgRating: avg,
      reviewCount: all.length,
    });

    // 🔹 Rozet güncellemesi
    await updateBadgesForTeacher(teacherId);

    /* -------------------------------------------------
     * 🔹 ÖĞRENCİYE YORUM SONRASI KUPON (tek seferlik)
     * ------------------------------------------------- */
    const studentRef = adminDb.collection('users').doc(studentId);
    const studentSnap = await studentRef.get();
    const studentData = studentSnap.exists ? studentSnap.data() : {};

    const plan = studentData.subscriptionPlan || 'free';
    const coupons = Array.isArray(studentData.lessonCoupons) ? [...studentData.lessonCoupons] : [];
    const alreadyHasReviewCoupon = coupons.some(c => c.type === 'lesson' && c.source === 'review-bonus');

    // sadece ilk yorumda kupon üret
    if (!alreadyHasReviewCoupon && ['starter', 'pro', 'vip'].includes(plan)) {
      const discountPercent = plan === 'starter' ? 5 : plan === 'pro' ? 10 : 15;

      const coupon = await stripe.coupons.create({
        percent_off: discountPercent,
        duration: 'once',
        name: `Review Bonus — ${discountPercent}% (${plan.toUpperCase()})`,
      });
      const promo = await stripe.promotionCodes.create({
        coupon: coupon.id,
        code: `REV-${studentId.slice(0, 5)}-${Date.now().toString().slice(-4)}`,
        max_redemptions: 1,
      });

      const newCoupon = {
        code: promo.code,
        promoId: promo.id,
        percent: discountPercent,
        type: 'lesson',
        source: 'review-bonus',
        used: false,
        active: true,
        createdAt: new Date(),
      };
      coupons.push(newCoupon);

      await studentRef.update({ lessonCoupons: coupons });

      try {
        await sendMail({
          to: studentData.email,
          subject: `🎁 ${discountPercent}% Off — Thanks for your Review!`,
          html: `
            <p>Hi ${studentData.name || 'there'},</p>
            <p>Thanks for leaving a review on your recent lesson!</p>
            <p>You've earned a <b>${discountPercent}% discount</b> for your next booking.</p>
            <p>Your coupon code: <b>${promo.code}</b></p>
            <p>Keep learning with BridgeLang!</p>
          `,
        });
      } catch (mailErr) {
        console.warn('⚠️ Review coupon email failed:', mailErr.message);
      }

      console.log(`🎁 Review coupon created for ${studentId}: ${promo.code} (${discountPercent}%)`);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('🔥 Review API error:', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
}
