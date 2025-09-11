import { completeLessonAndTransfer } from '../../lib/completeLessonAndTransfer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { booking } = req.body;

  try {
    await completeLessonAndTransfer(booking);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Transfer payout failed:', err.message);
    res.status(400).json({ error: err.message });
  }
}
