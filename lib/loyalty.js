import { db } from './firebase';
import { doc, getDoc, collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';

function computeConsecutiveMonths(paymentsDesc) {
  const MAX_GAP_MS = 40 * 24 * 60 * 60 * 1000;
  let months = 0, prev = null;
  for (const d of paymentsDesc) {
    const v = d.data();
    const t = v?.createdAt?.toMillis?.() ?? (v?.createdAt?.seconds ? v.createdAt.seconds * 1000 : Date.parse(v?.createdAt));
    if (!Number.isFinite(t)) continue;
    if (prev == null) { months = 1; prev = t; continue; }
    if (prev - t <= MAX_GAP_MS) { months += 1; prev = t; } else { break; }
  }
  return months;
}

export async function getLoyaltyInfo(uid) {
  const uSnap = await getDoc(doc(db, 'users', uid));
  if (!uSnap.exists()) return null;

  const u = uSnap.data() || {};
  const plan = u.subscriptionPlan || 'free';
  const paymentsCol = collection(db, 'users', uid, 'payments');
  const s = await getDocs(query(paymentsCol, orderBy('createdAt', 'desc'), limit(24)));
  const docs = s.docs.filter(d => d.data()?.planKey === plan);

  const loyaltyMonths = computeConsecutiveMonths(docs);
  const loyaltyBonusCount = (plan === 'pro' || plan === 'vip') ? Math.floor(loyaltyMonths / 3) : 0;

  // VIP Kalıcı indirim kontrolü
  const permanentDiscount = (plan === 'vip' && [6, 12, 18].includes(loyaltyMonths)) ? 10 : 0;

  return { plan, loyaltyMonths, loyaltyBonusCount, permanentDiscount };
}
