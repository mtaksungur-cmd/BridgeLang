import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { id, comment, rating } = req.body;

    await adminDb.collection('reviews').doc(id).update({
      comment,
      rating,
      updatedAt: new Date().toISOString(),
    });

    return res.json({ success: true });
  } catch (e) {
    console.error('updateReview error:', e);
    return res.status(500).json({ error: 'Update failed' });
  }
}
