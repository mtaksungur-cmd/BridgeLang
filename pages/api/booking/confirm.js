// pages/api/booking/confirm.js
import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { bookingId, role } = req.body; // role = 'student' | 'teacher'

  if (!bookingId || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const ref = adminDb.collection('bookings').doc(bookingId);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const data = snap.data();

    // ✅ Parental consent check
    if (role === 'student') {
      const studentSnap = await adminDb.collection('users').doc(data.studentId).get();
      if (studentSnap.exists && studentSnap.data().status === 'pending_consent') {
        return res.status(403).json({ error: 'Parental consent is required before confirming lessons.' });
      }
    }

    // Update confirmation status
    if (role === 'student') {
      await ref.update({ studentConfirmed: true });
      console.log('Student confirmed lesson:', bookingId);
    } else if (role === 'teacher') {
      await ref.update({ teacherApproved: true });
      console.log('Teacher confirmed lesson:', bookingId);
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Refresh data
    const updatedSnap = await ref.get();
    const updatedData = updatedSnap.data();

    // Check if both confirmed
    const bothConfirmed = updatedData.studentConfirmed && updatedData.teacherApproved;

    if (bothConfirmed) {
      console.log('✅ Both parties confirmed - marking as completed');

      // Update student stats
      try {
        const studentRef = adminDb.collection('users').doc(updatedData.studentId);
        const studentSnap = await studentRef.get();

        if (studentSnap.exists) {
          const studentData = studentSnap.data();
          const newLessonCount = (studentData.lessonsTaken || 0) + 1;

          await studentRef.update({
            lessonsTaken: newLessonCount,
            lastLessonDate: updatedData.date
          });

          console.log(`📊 Updated student stats: ${newLessonCount} lessons`);
        }
      } catch (err) {
        console.warn('Student stats update failed:', err.message);
      }

      // Mark as completed
      await ref.update({ status: 'completed' });

      // ✅ Enable unlimited messaging between student and this teacher after lesson
      try {
        const studentMsgRef = adminDb.collection('users').doc(updatedData.studentId);
        await studentMsgRef.update({
          [`messagesAfterLesson.${updatedData.teacherId}`]: true
        });
        console.log(`💬 Enabled unlimited messaging for student ${updatedData.studentId} with teacher ${updatedData.teacherId}`);
      } catch (msgErr) {
        console.warn('messagesAfterLesson update failed:', msgErr.message);
      }

      // ✅ TRIGGER PAYMENT TRANSFER TO TEACHER (ESCROW RELEASE)
      console.log('💰 Initiating payment transfer to teacher...');

      try {
        // Use internal API call
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const transferResponse = await fetch(`${baseUrl}/api/payment/transfer-to-teacher`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: bookingId })
        });

        if (transferResponse.ok) {
          const transferData = await transferResponse.json();
          console.log('✅ Payment transferred:', transferData);
        } else {
          const error = await transferResponse.json();
          console.error('❌ Transfer failed:', error.error);
          // Don't fail the confirmation - admin can manually trigger
        }
      } catch (transferError) {
        console.error('❌ Transfer request failed:', transferError.message);
        // Continue - don't fail the confirmation
      }
    }

    return res.status(200).json({
      success: true,
      completed: bothConfirmed
    });

  } catch (error) {
    console.error('Confirm error:', error);
    return res.status(500).json({ error: error.message });
  }
}
