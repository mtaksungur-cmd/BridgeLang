// pages/api/review/[lessonId].js
import { adminDb } from '../../../lib/firebaseAdmin';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import Stripe from 'stripe';
import { isInappropriate } from '../../../lib/messageFilter';
import { updateBadgesForTeacher } from '../../../lib/badgeUtilsServer';
import { sendMail } from '../../../lib/mailer';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: Buffer.from(
        process.env.FIREBASE_PRIVATE_KEY_BASE64,
        'base64'
      ).toString('utf-8'),
    }),
  });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

function buildDisplayFields(userData, userConsented) {
  const fullName = (userData?.name || 'Anonymous').trim();
  const photo = userData?.profilePhotoUrl || null;

  const mask = (s) => (s ? `${s[0]}****` : '');

  if (userConsented) {
    return {
      user_consented: true,
      display_name: fullName,
      display_photo: photo,
      consentGivenAt: new Date().toISOString(),
    };
  }

  const parts = fullName.split(/\s+/);
  const first = parts[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1] : '';

  const anon =
    (first ? mask(first) : '') +
    (last ? ` ${mask(last)}` : '');

  return {
    user_consented: false,
    display_name: anon || 'Anonymous',
    display_photo: null,
    consentGivenAt: null,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { lessonId } = req.query;
  const { rating, comment, userConsented } = req.body;

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

    const studentRef = adminDb.collection('users').doc(studentId);
    const studentSnap = await studentRef.get();
    const studentData = studentSnap.exists ? studentSnap.data() : {};

    // 🔹 Görüntülenecek isim / foto rıza durumuna göre hesaplanıyor
    const display = buildDisplayFields(studentData, !!userConsented);

    await adminDb.collection('reviews').doc(lessonId).set({
      lessonId,
      teacherId,
      studentId,
      rating,
      comment: comment || '',
      createdAt: new Date().toISOString(),
      review_type: 'teacher_review',
      user_consented: display.user_consented,
      display_name: display.display_name,
      display_photo: display.display_photo,
      consentGivenAt: display.consentGivenAt,
      hidden: false,          // 🔹 kullanıcı “hide” ederse true yapılacak
    });

    // 🔹 Öğretmenin ortalama puanı
    const rSnap = await adminDb.collection('reviews').where('teacherId', '==', teacherId).get();
    const all = rSnap.docs.map(d => d.data());
    const total = all.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avg = all.length > 0 ? total / all.length : 0;

    await adminDb.collection('users').doc(teacherId).update({
      avgRating: avg,
      reviewCount: all.length,
    });

    await updateBadgesForTeacher(teacherId);

    // 🔹 Öğrenci için review bonus (eski mantık olduğu gibi)
    const plan = studentData.subscriptionPlan || 'free';
    const coupons = Array.isArray(studentData.lessonCoupons) ? [...studentData.lessonCoupons] : [];
    const alreadyHasReviewCoupon = coupons.some(
      c => c.type === 'lesson' && (c.source === 'review-bonus' || c.source === 'first-review')
    );

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

      if (studentData.emailNotifications !== false) {
        try {
          await sendMail({
            to: studentData.email,
            subject: `🎁 ${discountPercent}% Off — Thanks for your Review!`,
            html: `
              <p>Hi ${studentData.name || 'there'},</p>
              <p>Thanks for leaving a review on your recent lesson!</p>
              <p>You've earned a <b>${discountPercent}% discount</b> for your next booking.</p>
              <p>Your reward has been automatically added to your account and will apply automatically to your next eligible lesson payment.</p>
              <p>If you still have an active “first 6 lessons” discount, this loyalty reward will activate once that offer ends.</p>
              <p>Keep learning with BridgeLang!</p>
            `,
          });
        } catch (mailErr) {
          console.warn('⚠️ Review coupon email failed:', mailErr.message);
        }
      } else {
        console.log(`📭 Skipped review mail — ${studentData.email} disabled notifications`);
      }

      console.log(`🎁 Review coupon created for ${studentId}: ${promo.code} (${discountPercent}%)`);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('🔥 Review API error:', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
}
