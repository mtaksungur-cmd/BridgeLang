import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Eğer client sadece rozetleri gösterecekse, burası basit bir getter olabilir
export async function getBadgesForTeacher(teacherId) {
  const snap = await getDoc(doc(db, 'users', teacherId));
  if (!snap.exists()) return [];
  return snap.data().badges || [];
}
