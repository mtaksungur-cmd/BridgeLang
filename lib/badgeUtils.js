import { doc, getDoc, getDocs, collection, query, where, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

const toDate = (ts) => ts?.toDate?.() || new Date(ts);

export async function updateBadgesForTeacher(teacherId) {
  const userRef = doc(db, 'users', teacherId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const user = userSnap.data();
  const badges = [];

  // 🆕 New Teacher: İlk 30 gün
  const createdAt = toDate(user.createdAt);
  const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated <= 30) {
    badges.push('🆕 New Teacher');
  }

  // 💼 Active Teacher: Son 3 ayda ≥8 ders
  const cutoffActive = Timestamp.fromDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  const activeQuery = query(
    collection(db, 'bookings'),
    where('teacherId', '==', teacherId),
    where('status', '==', 'approved'),
    where('createdAt', '>=', cutoffActive)
  );
  const activeSnap = await getDocs(activeQuery);
  if (activeSnap.size >= 8) {
    badges.push('💼 Active Teacher');
  }

  // 🌟 5-Star Teacher: Son 20 yorumda ortalama ≥4.8
  const reviewQuery = query(
    collection(db, 'reviews'),
    where('teacherId', '==', teacherId)
  );
  const reviewSnap = await getDocs(reviewQuery);
  const reviews = reviewSnap.docs.map(doc => doc.data()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const recent20 = reviews.slice(0, 20);
  const avg = recent20.length > 0 ? recent20.reduce((sum, r) => sum + r.rating, 0) / recent20.length : 0;
  if (recent20.length >= 3 && avg >= 4.8) {
    badges.push('🌟 5-Star Teacher');
  }

  await updateDoc(userRef, { badges });
}