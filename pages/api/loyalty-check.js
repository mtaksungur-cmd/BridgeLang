import { adminDb } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const TEST_MODE = true; // <=== TEST için true, Production için false bırak!

  const userRef = adminDb.collection('users').doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return res.status(404).json({ error: "User not found" });

  const data = userSnap.data();

  if (!['pro', 'vip'].includes(data.subscriptionPlan)) {
    return res.status(200).json({ loyaltyBonus: false });
  }

  let { loyaltyBonusCount = 0, discountGivenCount = 0, subscriptionStartedAt } = data;

  const now = new Date();
  const start = subscriptionStartedAt?.toDate?.() || new Date();

  let months;
  // ----- TEST MODU -----
  if (TEST_MODE) {
    months = Math.floor((now - start) / (1000 * 60 * 60)); // 1 saat = 1 ay
  } else {
    // ----- GERÇEK MOD -----
    months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  }

  // Her 3 ayda bir (veya testte her 3 saatte bir) bonus kredi
  const newBonusCount = Math.floor(months / 3);
  let bonusToAdd = newBonusCount - (loyaltyBonusCount || 0);

  let updateObj = {};
  let bonusGiven = false;

  if (bonusToAdd > 0) {
    updateObj.credits = (data.credits || 0) + bonusToAdd;
    updateObj.loyaltyBonusCount = newBonusCount;
    bonusGiven = true;
  }

  // VIP için 6 ayda bir indirim
  let discountEligible = false;
  if (data.subscriptionPlan === 'vip') {
    const newDiscountCount = Math.floor(months / 6);
    if (newDiscountCount > (discountGivenCount || 0)) {
      updateObj.discountEligible = true;
      updateObj.discountGivenCount = newDiscountCount;
      discountEligible = true;
    }
  }

  updateObj.loyaltyMonths = months;

  if (Object.keys(updateObj).length > 0) {
    await userRef.update(updateObj);
  }

  res.status(200).json({
    loyaltyBonus: bonusGiven,
    months,
    loyaltyBonusCount: newBonusCount,
    discountEligible,
  });
}
