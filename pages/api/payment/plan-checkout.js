import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, userEmail, planKey, currentPlan } = req.body;
  if (!userId || !userEmail || !planKey) return res.status(400).json({ error: 'Missing fields' });

  try {
    const amount =
      planKey === 'starter' ? 4.99 :
      planKey === 'pro' ? 9.99 :
      planKey === 'vip' ? 14.99 : 0;
    if (!amount) return res.status(400).json({ error: 'Invalid plan' });

    // 🔹 Firestore'dan mevcut aboneliği al
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : {};
    const current = userData.subscriptionPlan || 'free';

    // 🔹 Aynı planı seçmişse hata
    if (current === planKey) {
      return res.status(400).json({ error: 'You already have this plan.' });
    }

    // 🔹 Upgrade / Downgrade ayrımı
    const PLAN_ORDER = ['free', 'starter', 'pro', 'vip'];
    const isUpgrade = PLAN_ORDER.indexOf(planKey) > PLAN_ORDER.indexOf(current);

    if (isUpgrade) {
      // 🎯 UPGRADE → hemen Stripe Checkout ile başlat
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { name: `${planKey.toUpperCase()} Plan (Upgrade)` },
            unit_amount: amount * 100,
          },
          quantity: 1,
        }],
        allow_promotion_codes: true,
        customer_email: userEmail,
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
        metadata: { bookingType: 'plan', userId, planKey },
      });
      return res.status(200).json({ url: session.url });
    } else {
      // 🔹 DOWNGRADE → dönem sonuna ertele
      const sub = userData.subscription || {};
      const pendingPlan = planKey;

      await userRef.set({
        subscription: {
          ...sub,
          pending_downgrade_to: pendingPlan,
        }
      }, { merge: true });

      // 🔸 Bilgilendirme e-postası
      await sendMail({
        to: userEmail,
        subject: '📅 Subscription downgrade scheduled',
        html: `
          <p>Hello,</p>
          <p>Your downgrade to the <b>${pendingPlan.toUpperCase()}</b> plan will take effect 
          at the end of your current billing cycle.</p>
          <p>No refunds are issued for early downgrades.</p>
          <p>— BridgeLang Team</p>
        `
      });

      return res.status(200).json({ message: 'Downgrade scheduled for next billing cycle.' });
    }
  } catch (err) {
    console.error('plan-checkout error:', err);
    res.status(500).json({ error: 'Checkout failed' });
  }
}
