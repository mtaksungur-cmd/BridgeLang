import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { id } = req.body;
    await adminDb.collection('reviews').doc(id).delete();
    return res.json({ success: true });
  } catch (e) {
    console.error('deleteReview error:', e);
    return res.status(500).json({ error: 'Delete failed' });
  }
}
