import { adminDb } from './firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

const toDate = (ts) => ts?.toDate?.() || new Date(ts);

export async function updateBadgesForTeacher(teacherId) {
  const userRef = adminDb.collection('users').doc(teacherId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;

  const user = userSnap.data();
  const badges = [];

  // 🆕 New Teacher
  const createdAt = toDate(user.createdAt);
  const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated <= 30) {
    badges.push('🆕 New Teacher');
  }

  // 💼 Active Teacher
  const cutoffActive = Timestamp.fromDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  const activeSnap = await adminDb
    .collection('bookings')
    .where('teacherId', '==', teacherId)
    .where('status', '==', 'approved')
    .where('createdAt', '>=', cutoffActive)
    .get();
  if (activeSnap.size >= 8) {
    badges.push('💼 Active Teacher');
  }

  // 🌟 5-Star Teacher
  const reviewSnap = await adminDb.collection('reviews').where('teacherId', '==', teacherId).get();
  const reviews = reviewSnap.docs.map(d => d.data()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const recent20 = reviews.slice(0, 20);
  const avg = recent20.length > 0 ? recent20.reduce((sum, r) => sum + r.rating, 0) / recent20.length : 0;
  if (recent20.length >= 3 && avg >= 4.8) {
    badges.push('🌟 5-Star Teacher');
  }

  await userRef.update({ badges });
}
