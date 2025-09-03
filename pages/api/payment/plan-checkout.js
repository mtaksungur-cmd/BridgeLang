import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_ID_STARTER,
  pro: process.env.STRIPE_PRICE_ID_PRO,
  vip: process.env.STRIPE_PRICE_ID_VIP
};

async function getOrCreateCustomer(userId, email) {
  const uref = adminDb.collection('users').doc(userId);
  const usnap = await uref.get();
  const saved = usnap.exists ? usnap.data()?.stripeCustomerId : null;
  if (saved) {
    try { return await stripe.customers.retrieve(saved); } catch { /* create below */ }
  }
  const c = await stripe.customers.create({ email, metadata: { userId } });
  try { await uref.update({ stripeCustomerId: c.id }); } catch {}
  return c;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, planKey, userEmail } = req.body;
  if (!userId || !planKey || !userEmail) return res.status(400).json({ error: 'Missing fields' });

  const priceId = PRICE_IDS[planKey];
  if (!priceId) return res.status(400).json({ error: 'Invalid planKey' });

  try {
    const customer = await getOrCreateCustomer(userId, userEmail);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customer.id,
      allow_promotion_codes: true,      // VIP’e 5. ödemeden sonra vereceğimiz kod burada girilecek
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: { bookingType: 'plan', userId, planKey }
    });
    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('plan-checkout error:', e);
    return res.status(500).json({ error: 'Checkout init failed' });
  }
}
