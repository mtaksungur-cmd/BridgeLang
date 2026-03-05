// pages/api/transfer-payout.js
import { completeLessonAndTransfer } from '../../lib/completeLessonAndTransfer';
import { adminDb } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { bookingId } = req.body;
  if (!bookingId) return res.status(400).json({ error: 'Missing bookingId' });

  try {
    const snap = await adminDb.collection('bookings').doc(bookingId).get();
    if (!snap.exists) throw new Error('Booking not found');

    const booking = { id: snap.id, ...snap.data() };

    if (booking.status !== 'approved') {
      return res.status(400).json({ error: 'Lesson not approved yet' });
    }

    await completeLessonAndTransfer(booking);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Transfer payout failed:', err);
    return res.status(500).json({ error: err.message });
  }
}
