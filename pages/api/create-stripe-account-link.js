import { adminDb } from '../../lib/firebaseAdmin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const { uid } = req.query;

  if (!uid) return res.status(400).json({ error: 'Missing user ID' });

  const userRef = adminDb.collection('users').doc(uid);
  const doc = await userRef.get();
  const user = doc.data();

  let accountId = user.stripeAccountId;

  // Stripe hesabı yoksa oluştur
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'standard',
      email: user.email,
    });

    accountId = account.id;
    await userRef.update({ stripeAccountId: accountId });
  }

  // Stripe bağlantı linki oluştur
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: process.env.STRIPE_REDIRECT_URL,
    return_url: process.env.STRIPE_REDIRECT_URL,
    type: 'account_onboarding',
  });

  res.status(200).json({ url: accountLink.url });
}
