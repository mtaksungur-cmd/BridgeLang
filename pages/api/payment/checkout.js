// pages/api/payment/checkout.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const {
      teacherId,
      studentId,
      date,        // "yyyy-MM-dd"
      startTime,   // "HH:mm"
      endTime,     // "HH:mm"
      duration,    // number or string
      location,
      price,       // number (GBP)
      studentEmail,
      timezone
    } = req.body;

    if (!teacherId || !studentId || !date || !startTime || !duration || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const durationMinutes = Number.parseInt(duration, 10);
    if (Number.isNaN(durationMinutes) || durationMinutes <= 0) {
      return res.status(400).json({ error: 'Invalid duration' });
    }

    // SADECE Stripe Checkout oluştur; tüm bilgileri metadata'ya koy
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: { name: 'Private Lesson' },
            unit_amount: Math.round(Number(price) * 100), // £ → pence
          },
          quantity: 1,
        },
      ],
      customer_email: studentEmail || undefined,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: {
        bookingType: 'lesson',
        teacherId,
        studentId,
        date,
        startTime,
        endTime: endTime || '',
        duration: String(durationMinutes),
        location,
        timezone: timezone || '',
        // bookingId BİLEREK YOK → DB kaydı sadece webhook’ta oluşacak
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('checkout error:', err);
    return res.status(500).json({ error: 'Checkout init failed' });
  }
}
