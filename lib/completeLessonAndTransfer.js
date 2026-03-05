import Stripe from 'stripe';
import { adminDb } from './firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export async function completeLessonAndTransfer(booking) {
  if (!booking.teacherId) throw new Error('Invalid booking data');
  if (booking.status !== 'approved') throw new Error('Payout allowed only when lesson is approved.');

  const teacherSnap = await adminDb.collection('users').doc(booking.teacherId).get();
  const teacher = teacherSnap.data();
  if (!teacher) throw new Error('Teacher not found.');
  const stripeAccountId = teacher?.stripeAccountId;
  if (!stripeAccountId) throw new Error('Teacher has no Stripe account.');

  if (booking.payoutSent) {
    console.log(`⚠️ Payout already sent for booking ${booking.id}`);
    return;
  }

  // 🔑 ÖNEMLİ: Artık teacherShare alanını kullanıyoruz.
  // Geriye uyumluluk için yoksa amountPaid*0.8
  const teacherShare = Number.isFinite(booking.teacherShare)
    ? booking.teacherShare
    : (Number(booking.amountPaid || 0) * 0.8);

  const amountToSend = Math.round(teacherShare * 100); // cents

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`💡 [TEST MODE] Simulated payout: £${(amountToSend / 100).toFixed(2)} to ${stripeAccountId}`);
    } else {
      await stripe.transfers.create({
        amount: amountToSend,
        currency: 'gbp',
        destination: stripeAccountId,
        description: `BridgeLang Lesson Payment - ${booking.date} ${booking.startTime}`,
        transfer_group: booking.lessonId || booking.id,
      });
    }

    const prevEarnings = Number(teacher.totalEarnings || 0);
    await adminDb.collection('users').doc(booking.teacherId).update({
      totalEarnings: prevEarnings + amountToSend / 100,
    });

    await adminDb.collection('bookings').doc(booking.id).update({
      payoutSent: true,
      payoutAt: new Date(),
    });

    console.log(`✅ Transfer simulated/sent for booking ${booking.id}`);
  } catch (err) {
    console.error('❌ Transfer payout failed:', err);
    throw err;
  }
}
