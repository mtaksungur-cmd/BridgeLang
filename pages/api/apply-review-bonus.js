// pages/api/apply-review-bonus.js
import { adminDb } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const userRef = adminDb.collection('users').doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return res.status(404).json({ error: "User not found" });

  const data = userSnap.data();

  // Eğer bonus daha önce alınmadıysa ve abonelik başlatılalı 31 günden az olduysa
  const now = new Date();
  const start = data.subscriptionStartedAt?.toDate?.() || new Date();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));

  if (!data.reviewBonusUsed && diffDays < 31) {
    await userRef.update({
      credits: (data.credits || 0) + 1,
      reviewBonusUsed: true
    });
    return res.status(200).json({ bonusGiven: true });
  }

  res.status(200).json({ bonusGiven: false });
}
