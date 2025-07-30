import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Tüm verileri logla
  const {
    teacherId,
    studentId,
    date,
    startTime,
    endTime,
    duration,
    location,
    meetingLink,
    price,
    studentEmail
  } = req.body;

  // Eksik alan var mı?
  if (
    !teacherId ||
    !studentId ||
    !date ||
    !startTime ||
    !endTime ||
    !duration ||
    !location ||
    !price ||
    !studentEmail
  ) {
    console.error('Missing required fields:', req.body);
    return res.status(400).json({ error: 'Missing required booking or payment fields.' });
  }

  try {
    // Stripe Checkout session oluştur
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
            unit_amount: Math.round(price * 100), // Pence cinsinden
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingType: 'lesson',
        teacherId,
        studentId,
        date,
        startTime,
        endTime,
        duration: String(duration),
        location,
        meetingLink
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
    });

    // Frontende checkout linkini dön
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
}
