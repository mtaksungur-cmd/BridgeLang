import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

// Plan → Stripe Price ID eşlemesi (Vercel env'de tanımla)
const PRICE_MAP = {
  starter: process.env.STRIPE_PRICE_STARTER, // ör: price_123
  pro: process.env.STRIPE_PRICE_PRO,
  vip: process.env.STRIPE_PRICE_VIP,
};

const PLAN_ORDER = ['free', 'starter', 'pro', 'vip'];

async function getOrCreateCustomer({ userId, userEmail }) {
  const uref = adminDb.collection('users').doc(userId);
  const snap = await uref.get();
  const data = snap.exists ? snap.data() : {};
  let customerId = data?.stripe?.customerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId },
    });
    customerId = customer.id;
    await uref.set({ stripe: { ...(data.stripe || {}), customerId } }, { merge: true });
  }
  return customerId;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, userEmail, planKey } = req.body;
  if (!userId || !userEmail || !planKey) return res.status(400).json({ error: 'Missing fields' });

  try {
    const priceId = PRICE_MAP[planKey];
    if (!priceId) return res.status(400).json({ error: 'Invalid plan' });

    // Firestore'daki mevcut durum
    const uref = adminDb.collection('users').doc(userId);
    const usnap = await uref.get();
    const udata = usnap.exists ? usnap.data() : {};
    const current = udata.subscriptionPlan || 'free';

    if (current === planKey) {
      return res.status(400).json({ error: 'You already have this plan.' });
    }

    const isUpgrade = PLAN_ORDER.indexOf(planKey) > PLAN_ORDER.indexOf(current);

    // Müşteriyi garanti altına al
    const customerId = await getOrCreateCustomer({ userId, userEmail });

    // Mevcut aktif subscription var mı?
    const subscriptionId = udata?.stripe?.subscriptionId || null;
    const itemId = udata?.stripe?.subscriptionItemId || null;

    if (isUpgrade) {
      // UPGRADE
      if (subscriptionId && itemId) {
        // Var olan abonelikte plan değiştir → proration otomatik (farkı tahsil eder)
        const updated = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false,
          proration_behavior: 'create_prorations',
          items: [{ id: itemId, price: priceId }],
        });

        // Firestore stripe meta güncelle
        const subItem = updated.items?.data?.[0];
        await uref.set({
          stripe: {
            ...(udata.stripe || {}),
            subscriptionId: updated.id,
            subscriptionItemId: subItem?.id || itemId,
          },
        }, { merge: true });

        // UI mevcut akışla uyumlu: URL yerine mesaj döndürüyoruz
        return res.status(200).json({ message: 'Subscription upgraded. Proration will be charged automatically.' });
      } else {
        // İlk kez abonelik başlat → Checkout (mode: subscription)
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [{ price: priceId, quantity: 1 }],
          allow_promotion_codes: true,
          subscription_data: {
            metadata: { userId, planKey },
          },
          success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
          metadata: { bookingType: 'subscription_start', userId, planKey },
        });
        return res.status(200).json({ url: session.url });
      }
    } else {
      // DOWNGRADE → dönem sonuna ertele (biz uygulayacağız)
      const sub = udata.subscription || {};
      await uref.set({
        subscription: { ...sub, pending_downgrade_to: planKey },
      }, { merge: true });

      // İsteğe bağlı: Stripe tarafında da dönem sonu iptal açık kalabilir
      if (subscriptionId) {
        try {
          await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false });
        } catch (e) {
          console.warn('[plan-checkout] Could not update subscription flags:', e?.message || e);
        }
      }

      await sendMail({
        to: userEmail,
        subject: '📅 Subscription downgrade scheduled',
        html: `
          <p>Hello,</p>
          <p>Your downgrade to the <b>${planKey.toUpperCase()}</b> plan will take effect at the end of your current billing cycle.</p>
          <p>No refunds are issued for early downgrades.</p>
          <p>— BridgeLang Team</p>
        `
      });

      return res.status(200).json({ message: 'Downgrade scheduled for next billing cycle.' });
    }
  } catch (err) {
    console.error('plan-checkout (recurring) error:', err);
    res.status(500).json({ error: 'Checkout failed' });
  }
}
