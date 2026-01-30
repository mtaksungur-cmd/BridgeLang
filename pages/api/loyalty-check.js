import { adminDb } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const userRef = adminDb.collection('users').doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return res.status(404).json({ error: "User not found" });

  const data = userSnap.data();
  const { subscriptionPlan, subscriptionStartedAt, loyaltyBonusCount = 0 } = data;

  if (!['pro', 'vip'].includes(subscriptionPlan)) {
    return res.json({ loyaltyBonus: false });
  }

  const now = new Date();
  const start = subscriptionStartedAt?.toDate?.() || new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();

  const newBonusCount = Math.floor(months / 3);
  const bonusToAdd = newBonusCount - loyaltyBonusCount;
  let update = {};
  let bonusGiven = false;

  if (bonusToAdd > 0) {
    update.credits = (data.credits || 0) + bonusToAdd;
    update.loyaltyBonusCount = newBonusCount;
    bonusGiven = true;
  }

  if (Object.keys(update).length > 0) await userRef.update(update);

  res.json({ loyaltyBonus: bonusGiven, months });
}
