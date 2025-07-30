import { completeLessonAndTransfer } from '../../lib/completeLessonAndTransfer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { booking } = req.body;
  try {
    await completeLessonAndTransfer(booking);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
