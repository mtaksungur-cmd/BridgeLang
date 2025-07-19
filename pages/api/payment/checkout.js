import Stripe from 'stripe';
import { db } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { lessonId, price, studentEmail } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: studentEmail,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'BridgeLang Lesson',
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        lessonId
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
    });

    // Stripe session ID'yi Firestore'a kaydet
    await updateDoc(doc(db, 'lessons', lessonId), {
      stripeSessionId: session.id
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
}
