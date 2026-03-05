import Stripe from 'stripe';
import { adminDb } from '../../lib/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const { accountId } = req.query;
  if (!accountId) return res.status(400).json({ error: 'Missing account ID' });

  try {
    const account = await stripe.accounts.retrieve(accountId);
    return res.status(200).json({ details_submitted: account.details_submitted });
  } catch (err) {
    console.error('Stripe account check failed:', err);
    return res.status(500).json({ error: 'Stripe error' });
  }
}
