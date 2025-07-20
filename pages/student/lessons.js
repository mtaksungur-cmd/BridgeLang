import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import StudentLayout from '../../components/StudentLayout';

export default function StudentLessons() {
  const [bookings, setBookings] = useState([]);
  const [uid, setUid] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const q = query(
          collection(db, 'bookings'),
          where('studentId', '==', user.uid),
          where('status', 'in', ['confirmed', 'teacher_approved', 'student_approved', 'approved'])
        );
        const snap = await getDocs(q);
        setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });
  }, []);

  const confirmLesson = async (booking) => {
    const updates = { studentConfirmed: true };

    if (booking.teacherApproved) updates.status = 'approved';
    else updates.status = 'student_approved';

    await updateDoc(doc(db, 'bookings', booking.id), updates);

    setBookings(prev =>
      prev.map(b => b.id === booking.id ? { ...b, ...updates } : b)
    );

    alert('You confirmed the lesson.');
  };

  const parseTimeTo24h = (timeStr) => {
    const [_, time, modifier] = timeStr.match(/(\d{1,2}:\d{2})\s?(AM|PM)/i) || [];
    if (!time || !modifier) return timeStr;
    let [hours, minutes] = time.split(":");
    hours = parseInt(hours);
    if (modifier.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  const isPastLesson = (dateStr, timeStr) => {
    const cleanTime = parseTimeTo24h(timeStr);
    const dateTime = new Date(`${dateStr}T${cleanTime}`);
    return new Date() > dateTime;
  };

  return (
    <StudentLayout>
    <div style={{ padding: 40 }}>
      <h2>📘 Your Lessons</h2>
      {bookings.map(b => (
        <div key={b.id} style={{ border: '1px solid #ccc', margin: 10, padding: 10 }}>
          <p>{b.date} – {b.startTime} to {b.endTime}</p>
          <p><strong>Status:</strong> {b.status}</p>

          {isPastLesson(b.date, b.endTime) && !b.studentConfirmed && (
            <button onClick={() => confirmLesson(b)}>✅ I attended</button>
          )}
          {b.status === 'approved' && (
            <p style={{ color: 'green' }}>🎉 Lesson approved by both sides.</p>
          )}
        </div>
      ))}
    </div>
    </StudentLayout>
  );
}
