// pages/api/review/[lessonId].js
import { adminDb } from '../../../lib/firebaseAdmin';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { isInappropriate } from '../../../lib/messageFilter';
import { updateBadgesForTeacher } from '../../../lib/badgeUtilsServer';
import Stripe from 'stripe';

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

  const coupon = await stripe.coupons.create({ percent_off: percent, duration: 'once' });
  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: randCode(),
    max_redemptions: 1,
    active: true,
  });
  return { code: promo.code, percent, type: 'lesson' };
}

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
    if (booking.status !== 'approved') return res.status(403).json({ error: 'Lesson not approved yet' });

    const teacherId = booking.teacherId;
    const studentId = booking.studentId;

    await adminDb.collection('reviews').doc(lessonId).set({
      lessonId, teacherId, studentId, rating, comment, createdAt: new Date().toISOString(),
    });

    const rSnap = await adminDb.collection('reviews').where('teacherId', '==', teacherId).get();
    const all = rSnap.docs.map(d => d.data());
    const total = all.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avg = all.length > 0 ? total / all.length : 0;

    await adminDb.collection('users').doc(teacherId).update({ avgRating: avg, reviewCount: all.length });
    await updateBadgesForTeacher(teacherId);

    // 🔹 İlk yorum → kupon
    const studentRef = adminDb.collection('users').doc(studentId);
    const studentSnap = await studentRef.get();
    if (studentSnap.exists && (studentSnap.data().reviewCount || 0) === 0) {
      const plan = studentSnap.data().subscriptionPlan || 'free';
      const c = await createReviewCoupon(plan);
      if (c) {
        const lessonCoupons = studentSnap.data().lessonCoupons || [];
        lessonCoupons.push({ ...c, createdAt: new Date() });
        await studentRef.update({ lessonCoupons });
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('🔥 Review API error:', err);
    res.status(500).json({ error: err
