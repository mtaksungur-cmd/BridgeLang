import { adminDb } from '../../lib/firebaseAdmin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const { uid } = req.query;

  if (!uid) return res.status(400).json({ error: 'Missing user ID' });

  try {
    const userRef = adminDb.collection('users').doc(uid);
    const doc = await userRef.get();
    const user = doc.data();

    let accountId = user.stripeAccountId;

    // Stripe hesabı yoksa oluştur
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'standard',
        email: user.email,
        business_type: 'individual',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;
      await userRef.update({ stripeAccountId: accountId });
    }

    // Stripe bağlantı linki oluştur
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/teacher/stripe-connect`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/teacher/stripe-connect`,
      type: 'account_onboarding',
    });

    res.status(200).json({ url: accountLink.url });
  } catch (err) {
    console.error('Stripe link error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
