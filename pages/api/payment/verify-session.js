// pages/api/payment/verify-session.js
// Fallback: Stripe webhook olmadan da plan güncellemesi yapabilmek için
// Success sayfası bu endpoint'i çağırarak ödemeyi doğrular ve planı günceller
import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';
import { PLAN_LIMITS } from '../../../lib/planLimits';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

  try {
    // Stripe'dan session bilgisini çek
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed', status: session.payment_status });
    }

    const metadata = session.metadata || {};

    // Sadece subscription_upgrade tipindeki ödemeleri işle
    if (metadata.bookingType !== 'subscription_upgrade' && metadata.bookingType !== 'subscription') {
      return res.status(200).json({ message: 'Not a plan payment', bookingType: metadata.bookingType });
    }

    const userId = metadata.userId;
    const upgradeTo = (metadata.upgradeTo || 'free').toLowerCase();

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId in session metadata' });
    }

    const limits = PLAN_LIMITS[upgradeTo] || PLAN_LIMITS.free;
    const userRef = adminDb.collection('users').doc(userId);
    const currentSnap = await userRef.get();
    const currentData = currentSnap.exists ? currentSnap.data() : {};

    // Zaten güncellenmiş mi kontrol et (webhook çoktan işlemiş olabilir)
    if (currentData.subscriptionPlan === upgradeTo && currentData.justUpgraded === true) {
      console.log(`✅ verify-session: User ${userId} already on ${upgradeTo} (webhook handled it)`);
      return res.status(200).json({
        message: 'Already updated',
        plan: upgradeTo,
        limits,
      });
    }

    // Plan güncelle
    const currentSub = currentData.subscription || {};
    const isRenewal = metadata.renewal === '1';
    const upgradeFrom = metadata.upgradeFrom || currentData.subscriptionPlan || 'free';

    let lifetimePayments = currentSub.lifetimePayments || 0;
    if (isRenewal || upgradeFrom === upgradeTo) {
      lifetimePayments += 1;
    } else {
      lifetimePayments = 1;
    }

    const now = Date.now();
    const activeUntilMillis = now + 30 * 24 * 60 * 60 * 1000;

    const updateData = {
      subscriptionPlan: upgradeTo,
      viewLimit: limits.viewLimit,
      messagesLeft: limits.messagesLeft,
      justUpgraded: true,
      subscription: {
        planKey: upgradeTo,
        activeUntil: new Date(activeUntilMillis),
        activeUntilMillis,
        lastPaymentAt: new Date(),
        updatedAt: new Date(),
        lifetimePayments,
        pending_downgrade_to: null,
      },
    };

    await userRef.set(updateData, { merge: true });
    console.log(`✅ verify-session: User ${userId} upgraded to ${upgradeTo}, limits:`, limits);

    return res.status(200).json({
      message: 'Plan updated successfully',
      plan: upgradeTo,
      limits,
    });
  } catch (err) {
    console.error('❌ verify-session error:', err);
    return res.status(500).json({ error: 'Verification failed', details: err.message });
  }
}
