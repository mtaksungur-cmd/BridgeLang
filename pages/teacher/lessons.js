import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { updateBadgesForTeacher } from '../../lib/badgeUtils';
import TeacherLayout from '../../components/TeacherLayout';

const parseTimeTo24h = (timeStr) => {
  const [_, hourStr, minuteStr, period] = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i) || [];
  if (!hourStr) return null;

  let hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);

  if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
  if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;

  return { hour, minute };
};

const isPastLesson = (dateStr, timeStr) => {
  const time = parseTimeTo24h(timeStr);
  if (!time) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  const dateTime = new Date(year, month - 1, day, time.hour, time.minute);
  return new Date() > dateTime;
};

export default function TeacherLessons() {
  const [bookings, setBookings] = useState([]);
  const [uid, setUid] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const q = query(
          collection(db, 'bookings'),
          where('teacherId', '==', user.uid)
        );
        const snap = await getDocs(q);
        setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });
  }, []);

  const handleAccept = async (bookingId) => {
    await updateDoc(doc(db, 'bookings', bookingId), { status: 'confirmed' });
    setBookings(prev => prev.map(r => r.id === bookingId ? { ...r, status: 'confirmed' } : r));
  };

  const handleComplete = async (booking) => {
    const updates = { teacherApproved: true };

    if (booking.studentConfirmed) updates.status = 'approved';
    else updates.status = 'teacher_approved';

    await updateDoc(doc(db, 'bookings', booking.id), updates);

    setBookings(prev => prev.map(r =>
      r.id === booking.id ? { ...r, ...updates } : r
    ));

    await updateBadgesForTeacher(booking.teacherId);
  };

  return (
    <TeacherLayout>
    <div style={{ padding: 40 }}>
      <h2>📩 Your Lessons</h2>
      {bookings.length === 0 ? <p>No lessons found.</p> : (
        bookings.map(r => (
          <div key={r.id} style={{ border: '1px solid #ccc', margin: 10, padding: 10 }}>
            <p><strong>Date:</strong> {r.date} | <strong>Time:</strong> {r.startTime} - {r.endTime}</p>
            <p><strong>Location:</strong> {r.location}</p>
            <p><strong>Status:</strong> {r.status}</p>

            {r.status === 'requested' && (
              <button onClick={() => handleAccept(r.id)}>✅ Accept</button>
            )}

            {['confirmed', 'student_approved'].includes(r.status) && isPastLesson(r.date, r.endTime) && (
              <button onClick={() => handleComplete(r)}>🎓 Confirm Lesson Completed</button>
            )}

            {r.status === 'approved' && (
              <p style={{ color: 'green' }}>🎉 Lesson approved by both sides.</p>
            )}
          </div>
        ))
      )}
    </div>
    </TeacherLayout>
  );
}
