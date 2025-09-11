import { adminDb } from '../../../lib/firebaseAdmin';
import { doc, getDoc, setDoc, collection, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import '../../../lib/firebaseAdmin';
import { isInappropriate } from '../../../lib/messageFilter';
import { updateBadgesForTeacher } from '../../../lib/badgeUtils';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { lessonId } = req.query;
  const { rating, comment } = req.body;
  
  if (!lessonId || !rating || typeof rating !== 'number') {
    return res.status(400).json({ error: 'Invalid input' });
  }
  
  if (comment && isInappropriate(comment)) {
    return res.status(400).json({ error: 'Inappropriate comment content' });
  }
  try {
    // 1. Get lesson
    const bookingSnap = await adminDb.collection('bookings').doc(lessonId).get();
    if (!bookingSnap.exists()) return res.status(404).end();
    const booking = bookingSnap.data();

    if (booking.status !== 'approved') {
      return res.status(403).json({ error: 'Lesson not approved yet' });
    }

    const teacherId = booking.teacherId;

    // 2. Save review
    await adminDb.collection('reviews').doc(lessonId).set({
      lessonId,
      teacherId,
      studentId: booking.studentId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    });

    // 3. Recalculate teacher ratings
    const rSnap = await adminDb.collection('reviews').where('teacherId', '==', teacherId).get();
    const all = rSnap.docs.map(d => d.data());
    const total = all.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avg = all.length > 0 ? total / all.length : 0;

    // 4. Update teacher document
    await adminDb.collection('users').doc(teacherId).update({ avgRating: avg, reviewCount: all.length });

    await updateBadgesForTeacher(teacherId);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
}
