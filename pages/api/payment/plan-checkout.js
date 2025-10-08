import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  vip: process.env.STRIPE_PRICE_VIP,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, userEmail, planKey, currentPlan } = req.body;
  if (!userId || !userEmail || !planKey) return res.status(400).json({ error: 'Missing fields' });

  try {
    // 🔹 Firestore'dan mevcut planı al
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : {};
    const current = userData.subscriptionPlan || 'free';

    // 🔹 Aynı planı seçmişse hata
    if (current === planKey) {
      return res.status(400).json({ error: 'You already have this plan.' });
    }

    const PLAN_ORDER = ['free', 'starter', 'pro', 'vip'];
    const isUpgrade = PLAN_ORDER.indexOf(planKey) > PLAN_ORDER.indexOf(current);

    // 🔹 Stripe müşteri oluşturma veya bulma
    let customerId = userData.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      });
      customerId = customer.id;
      await userRef.set({ stripeCustomerId: customerId }, { merge: true });
    }

    if (isUpgrade) {
      // 🎯 UPGRADE → Stripe subscription oluştur veya mevcut aboneliği güncelle
      const existingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });

      let subscriptionId;
      if (existingSubs.data.length > 0) {
        // Mevcut abonelik varsa güncelle (prorate otomatik yapılır)
        const oldSub = existingSubs.data[0];
        subscriptionId = oldSub.id;
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false,
          proration_behavior: 'create_prorations',
          items: [{
            id: oldSub.items.data[0].id,
            price: PRICE_IDS[planKey],
          }],
        });
      } else {
        // Yeni abonelik oluştur
        const sub = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: PRICE_IDS[planKey] }],
          proration_behavior: 'create_prorations',
          metadata: { userId, planKey },
        });
        subscriptionId = sub.id;
      }

      // 🔸 Bilgilendirme e-postası
      await sendMail({
        to: userEmail,
        subject: '✅ Subscription upgraded',
        html: `
          <p>Hello,</p>
          <p>Your plan has been upgraded to <b>${planKey.toUpperCase()}</b>.</p>
          <p>The change takes effect immediately. Stripe has automatically prorated your payment for the remaining days.</p>
          <p>— BridgeLang Team</p>
        `,
      });

      return res.status(200).json({ message: 'Subscription upgraded successfully.' });
    } else {
      // 🔹 DOWNGRADE → cancel_at_period_end
      const existingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });
      if (existingSubs.data.length === 0) {
        return res.status(400).json({ error: 'No active subscription found.' });
      }

      const sub = existingSubs.data[0];
      await stripe.subscriptions.update(sub.id, {
        cancel_at_period_end: true,
        metadata: { downgrade_to: planKey },
      });

      await userRef.set({
        subscription: {
          ...userData.subscription,
          pending_downgrade_to: planKey,
        },
      }, { merge: true });

      await sendMail({
        to: userEmail,
        subject: '📅 Subscription downgrade scheduled',
        html: `
          <p>Hello,</p>
          <p>Your downgrade to <b>${planKey.toUpperCase()}</b> is scheduled for the end of your current billing period.</p>
          <p>No refunds are issued for early downgrades.</p>
          <p>— BridgeLang Team</p>
        `,
      });

      return res.status(200).json({ message: 'Downgrade scheduled for end of billing period.' });
    }
  } catch (err) {
    console.error('plan-checkout error:', err);
    res.status(500).json({ error: 'Checkout failed' });
  }
}
