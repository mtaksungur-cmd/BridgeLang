import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { teacherName, teacherEmail, uid } = req.body;

  try {
    let teacherDoc = null;
    let teacherUid = uid;

    // Find teacher by UID, name, or email
    if (uid) {
      const snap = await adminDb.collection('users').doc(uid).get();
      if (snap.exists) teacherDoc = snap;
    }

    if (!teacherDoc && teacherEmail) {
      const snap = await adminDb.collection('users').where('email', '==', teacherEmail).limit(1).get();
      if (!snap.empty) {
        teacherDoc = snap.docs[0];
        teacherUid = teacherDoc.id;
      }
    }

    if (!teacherDoc && teacherName) {
      const snap = await adminDb.collection('users').where('name', '==', teacherName).limit(1).get();
      if (!snap.empty) {
        teacherDoc = snap.docs[0];
        teacherUid = teacherDoc.id;
      }
    }

    if (!teacherDoc || !teacherDoc.exists) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const data = teacherDoc.data ? teacherDoc.data() : teacherDoc.data;

    // Default weekly availability (Mon-Fri 9AM-5PM, Sat 10AM-2PM)
    const defaultAvailability = {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [{ start: '09:00', end: '17:00' }],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
      Saturday: [{ start: '10:00', end: '14:00' }],
      Sunday: [],
    };

    // Also fix role if needed
    const updates = {
      availability: defaultAvailability,
    };

    if (data.role !== 'teacher') {
      updates.role = 'teacher';
    }

    await adminDb.collection('users').doc(teacherUid).update(updates);

    return res.status(200).json({
      success: true,
      teacherUid,
      teacherName: data.name,
      message: `Availability set for ${data.name}. Role: ${updates.role || data.role}`,
    });
  } catch (error) {
    console.error('Fix teacher availability error:', error);
    return res.status(500).json({ error: error.message });
  }
}
