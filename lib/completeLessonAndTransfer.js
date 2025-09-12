// lib/completeLessonAndTransfer.js
import Stripe from 'stripe';
import { adminDb } from './firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function completeLessonAndTransfer(booking) {
  if (!booking.teacherId || !booking.amountPaid) {
    throw new Error('Invalid booking data');
  }

  if (booking.status !== 'approved') {
    throw new Error('Payout allowed only when lesson is approved.');
  }

  if (booking.payoutSent) {
    console.log("⚠️ Payout already sent for booking", booking.id);
    return;
  }

  const teacherSnap = await adminDb.collection('users').doc(booking.teacherId).get();
  const teacher = teacherSnap.data();
  const stripeAccountId = teacher?.stripeAccountId;

  if (!stripeAccountId) throw new Error('Teacher has no Stripe account.');

  await stripe.transfers.create({
    amount: Math.floor(booking.amountPaid * 0.8 * 100),
    currency: 'gbp',
    destination: stripeAccountId,
    description: `BridgeLang Lesson Payment - ${booking.date} ${booking.startTime}`,
    transfer_group: booking.lessonId || booking.id
  });

  const prevEarnings = teacher.totalEarnings || 0;
  const earningToAdd = booking.amountPaid * 0.8;

  await adminDb.collection('users').doc(booking.teacherId).update({
    totalEarnings: prevEarnings + earningToAdd
  });

  await adminDb.collection('bookings').doc(booking.id).update({
    payoutSent: true,
    payoutAt: new Date()
  });
}
