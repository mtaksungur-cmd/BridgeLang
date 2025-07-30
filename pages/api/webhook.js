import { buffer } from 'micro';
import Stripe from 'stripe';
import { adminDb } from '../../lib/firebaseAdmin';

export const config = {
  api: { bodyParser: false }
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata || {};

    console.log("Webhook meta:", meta);

    // 1) Ders rezervasyonu ödemesi
    if (meta.bookingType === "lesson") {
      const {
        teacherId,
        studentId,
        date,
        startTime,
        endTime,
        duration,
        location,
        meetingLink
      } = meta;

      // Alan kontrolü
      if (!teacherId || !studentId || !date) {
        console.error("Missing booking metadata", meta);
        return res.status(400).json({ error: "Missing booking metadata" });
      }

      await adminDb.collection('bookings').add({
        teacherId,
        studentId,
        date,
        startTime,
        endTime,
        duration,
        location,
        meetingLink: meetingLink || '',
        amountPaid: session.amount_total ? session.amount_total / 100 : null,
        status: 'pending-approval',
        teacherApproved: false,
        studentConfirmed: false,
        createdAt: new Date()
      });
      console.log('✅ Booking created in Firestore for session:', session.id);
    }
    // 2) Abonelik ödemesi
    else if (meta.bookingType === "subscription") {
      const { userId, planKey } = meta;
      if (!userId || !planKey) {
        console.error("Missing subscription metadata", meta);
        return res.status(400).json({ error: "Missing subscription metadata" });
      }

      // Her plan için limitleri burada ver
      let updates = { subscriptionPlan: planKey };
      if (planKey === "starter") {
        updates = { ...updates, credits: 3, viewLimit: 10, messagesLeft: 3 };
      } else if (planKey === "pro") {
        updates = { ...updates, credits: 6, viewLimit: 30, messagesLeft: 10 };
      } else if (planKey === "vip") {
        updates = { ...updates, credits: 12, viewLimit: 9999, messagesLeft: 9999 };
      }
    // Önce kullanıcı verisini çek
      const userRef = adminDb.collection('users').doc(userId);
      const userSnap = await userRef.get();
      let startField = {};
      if (!userSnap.exists || !userSnap.data().subscriptionStartedAt) {
        // Eğer ilk kez veya daha önce hiç yoksa:
        startField = { subscriptionStartedAt: new Date() };
      }

      await userRef.update({ ...updates, ...startField });
      console.log(`✅ Subscription activated for user ${userId}: ${planKey}`);
    }
    // 3) Kredi satın alma ödemesi
    else if (meta.bookingType === "credits") {
      const { userId, purchasedCredits } = meta;
      if (!userId || !purchasedCredits) {
        console.error("Missing credit purchase metadata", meta);
        return res.status(400).json({ error: "Missing credit purchase metadata" });
      }

      // Firestore’da mevcut krediyi oku ve artır
      const userRef = adminDb.collection('users').doc(userId);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        console.error("User not found for credit purchase:", userId);
        return res.status(404).json({ error: "User not found" });
      }
      const currentCredits = userSnap.data().credits || 0;
      await userRef.update({
        credits: currentCredits + Number(purchasedCredits)
      });
      console.log(`✅ Added ${purchasedCredits} credits to user ${userId}`);
    }
    else {
      console.log("⚠️ Unknown bookingType or missing metadata:", meta);
    }
  }

  res.status(200).json({ received: true });
}
