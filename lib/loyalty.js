// lib/loyalty.js
import { db } from './firebase';
import {
  doc, getDoc, collection, query, where, orderBy, getDocs, limit
} from 'firebase/firestore';

function computeConsecutiveMonths(paymentsDesc) {
  const MAX_GAP_MS = 40 * 24 * 60 * 60 * 1000;
  let months = 0, prev = null;
  for (const d of paymentsDesc) {
    const v = d.data();
    const t = v?.createdAt?.toMillis?.()
      ?? (v?.createdAt?.seconds ? v.createdAt.seconds * 1000 : Date.parse(v?.createdAt));
    if (!Number.isFinite(t)) continue;
    if (prev == null) { months = 1; prev = t; continue; }
    if (prev - t <= MAX_GAP_MS) { months += 1; prev = t; } else { break; }
  }
  return months;
}

export async function getLoyaltyInfo(uid) {
  const uref = doc(db, 'users', uid);
  const usnap = await getDoc(uref);
  if (!usnap.exists()) return null;

  const u = usnap.data() || {};
  const plan = u.subscriptionPlan || u.subscription?.planKey || '';

  const promoCode = u.subscription?.loyalty?.promoCode || null;
  const discountEligible = !!promoCode;

  const paymentsCol = collection(db, 'users', uid, 'payments');
  let docs = [];

  try {
    // ASIL (index gerektirir): planKey == plan + createdAt desc
    const q1 = query(
      paymentsCol,
      where('planKey', '==', plan),
      orderBy('createdAt', 'desc'),
      limit(24)
    );
    const s1 = await getDocs(q1);
    docs = s1.docs;
  } catch (e) {
    // Index yoksa geniş sorguya düş: sadece createdAt desc; client-side filtre
    if (e.code === 'failed-precondition') {
      const q2 = query(paymentsCol, orderBy('createdAt', 'desc'), limit(50));
      const s2 = await getDocs(q2);
      docs = s2.docs.filter(d => d.data()?.planKey === plan);
    } else {
      throw e;
    }
  }

  const loyaltyMonths = computeConsecutiveMonths(docs);
  const loyaltyBonusCount = (plan === 'pro' || plan === 'vip') ? Math.floor(loyaltyMonths / 3) : 0;

  return { plan, loyaltyMonths, loyaltyBonusCount, discountEligible, promoCode };
}
