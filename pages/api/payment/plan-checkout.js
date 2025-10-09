// pages/api/payment/plan-checkout.js
import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

const PRICE_MAP = {
  starter: process.env.STRIPE_PRICE_ID_STARTER,
  pro: process.env.STRIPE_PRICE_ID_PRO,
  vip: process.env.STRIPE_PRICE_ID_VIP,
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
    await uref.set(
      { stripe: { ...(data.stripe || {}), customerId } },
      { merge: true }
    );
  }
  return customerId;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, userEmail, planKey } = req.body;
  if (!userId || !userEmail || !planKey)
    return res.status(400).json({ error: 'Missing fields' });

  try {
    // Free plan ayrı ele alınır (Stripe aboneliğini kapatıp Firestore'da free'e döneriz)
    const priceId = PRICE_MAP[planKey] || null;

    const uref = adminDb.collection('users').doc(userId);
    const usnap = await uref.get();
    const udata = usnap.exists ? usnap.data() : {};
    const currentPlan = udata.subscriptionPlan || 'free';

    if (currentPlan === planKey) {
      return res.status(400).json({ error: 'You already have this plan.' });
    }

    // Müşteriyi garanti altına al
    const customerId = await getOrCreateCustomer({ userId, userEmail });
    const subscriptionId = udata?.stripe?.subscriptionId || null;
    const itemId = udata?.stripe?.subscriptionItemId || null;

    // ---- FREE'e GEÇİŞ (dönem sonu, iade yok) ----
    if (planKey === 'free') {
      if (subscriptionId) {
        // Dönem sonunda iptal — abonelik bitince webhook "customer.subscription.deleted" ile free'e çekeriz.
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }
      const sub = udata.subscription || {};
      await uref.set(
        { subscription: { ...sub, pending_downgrade_to: 'free' } },
        { merge: true }
      );

      try {
        await sendMail({
          to: userEmail,
          subject: '📅 Free plan scheduled',
          html: `
            <p>Hello,</p>
            <p>Your plan will switch to <b>FREE</b> at the end of your current billing cycle.</p>
            <p>No refunds are issued for early downgrades.</p>
            <p>— BridgeLang Team</p>
          `,
        });
      } catch (e) {
        console.warn('[plan-checkout] free mail failed:', e?.message || e);
      }

      return res.status(200).json({ message: 'Downgrade to FREE scheduled at period end.' });
    }

    // ---- STARTER/PRO/VIP geçişi ----
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const isUpgrade =
      PLAN_ORDER.indexOf(planKey) > PLAN_ORDER.indexOf(currentPlan);

    // Mevcut aktif sub varsa:
    if (subscriptionId && itemId) {
      if (isUpgrade) {
        // 💥 UPGRADE: Proration + hemen tahsil (always_invoice)
        const updated = await stripe.subscriptions.update(subscriptionId, {
          items: [{ id: itemId, price: priceId }],
          proration_behavior: 'create_prorations',
          billing_cycle_anchor: 'unchanged',
          payment_behavior: 'always_invoice', // <-- kritik: farkı hemen faturalandır ve tahsil etmeye çalış
          // collection_method, default_payment_method Stripe'ta müşteri için tanımlı olmalı
        });

        // Fatura oluştuysa durumuna göre dönüş ver
        let invoiceUrl = null;
        let invoicePaid = false;
        if (updated.latest_invoice) {
          const inv = await stripe.invoices.retrieve(
            typeof updated.latest_invoice === 'string'
              ? updated.latest_invoice
              : updated.latest_invoice.id
          );
          invoiceUrl = inv.hosted_invoice_url || null;
          invoicePaid = !!inv.paid;
        }

        // Firestore Stripe meta güncelle
        const subItem = updated.items?.data?.[0];
        await uref.set(
          {
            stripe: {
              ...(udata.stripe || {}),
              subscriptionId: updated.id,
              subscriptionItemId: subItem?.id || itemId,
            },
            // Upgrade anında etkin planı UI'da hemen göstermek için set edebiliriz.
            subscriptionPlan: planKey,
            subscription: {
              ...(udata.subscription || {}),
              planKey,
              pending_downgrade_to: null,
            },
          },
          { merge: true }
        );

        // Ödeme başarısızsa invoice linkini dön, kullanıcı ödesin
        if (!invoicePaid && invoiceUrl) {
          return res.status(200).json({
            invoiceUrl,
            message:
              'Upgrade created. Please complete the payment for the prorated difference.',
          });
        }

        return res
          .status(200)
          .json({ message: 'Subscription upgraded. Proration will be (or was) charged automatically.' });
      } else {
        // 🔻 DOWNGRADE: Dönem sonunda uygula
        const sub = udata.subscription || {};
        await uref.set(
          { subscription: { ...sub, pending_downgrade_to: planKey } },
          { merge: true }
        );

        // Stripe tarafında iptal etmiyoruz, sadece bayrak koyuyoruz (dönem başında webhook değiştirecek)
        try {
          await sendMail({
            to: userEmail,
            subject: '📅 Subscription downgrade scheduled',
            html: `
              <p>Hello,</p>
              <p>Your downgrade to the <b>${planKey.toUpperCase()}</b> plan will take effect at the end of your current billing cycle.</p>
              <p>No refunds are issued for early downgrades.</p>
              <p>— BridgeLang Team</p>
            `,
          });
        } catch (e) {
          console.warn('[plan-checkout] downgrade mail failed:', e?.message || e);
        }

        return res
          .status(200)
          .json({ message: 'Downgrade scheduled for next billing cycle.' });
      }
    }

    // Aktif bir abonelik YOKSA → ilk kez başlat (Checkout ile)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { userId, planKey }, // webhook "customer.subscription.created" yakalar
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: { bookingType: 'subscription_start', userId, planKey },
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('plan-checkout (recurring) error:', err);
    return res.status(500).json({ error: 'Checkout failed' });
  }
}
