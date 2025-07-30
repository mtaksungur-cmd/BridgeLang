import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, planKey, userEmail } = req.body;

  if (!userId || !planKey || !userEmail) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Planlara göre fiyat ID'leri (Stripe dashboardundan alacaksın!)
  const PRICES = {
    starter: process.env.STRIPE_PRICE_ID_STARTER,
    pro: process.env.STRIPE_PRICE_ID_PRO,
    vip: process.env.STRIPE_PRICE_ID_VIP,
  };

  const priceId = PRICES[planKey];
  if (!priceId) return res.status(400).json({ error: "Invalid plan" });

  try {
    // Stripe Checkout session oluştur
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        }
      ],
      metadata: {
        bookingType: "subscription",
        userId,
        planKey
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
