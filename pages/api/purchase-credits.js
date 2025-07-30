import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, userEmail, credits } = req.body;

  if (!userId || !userEmail || !credits) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const priceId = process.env.STRIPE_PRICE_ID_CREDIT;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: Number(credits),
        }
      ],
      metadata: {
        bookingType: "credits", // <-- Önemli
        userId,
        purchasedCredits: credits // <-- Önemli
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: "Could not create Stripe session" });
  }
}
