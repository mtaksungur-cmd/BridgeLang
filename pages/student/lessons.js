import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

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

    // Eğer öğretmen zaten onayladıysa → status: approved
    if (booking.teacherApproved) updates.status = 'approved';
    else updates.status = 'student_approved';

    await updateDoc(doc(db, 'bookings', booking.id), updates);

    setBookings(prev =>
      prev.map(b => b.id === booking.id ? { ...b, ...updates } : b)
    );

    alert('You confirmed the lesson.');
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>📘 Your Lessons</h2>
      {bookings.map(b => (
        <div key={b.id} style={{ border: '1px solid #ccc', margin: 10, padding: 10 }}>
          <p>{b.date} – {b.startTime} to {b.endTime}</p>
          <p><strong>Status:</strong> {b.status}</p>

          {!b.studentConfirmed && (
            <button onClick={() => confirmLesson(b)}>✅ I attended</button>
          )}
          {b.status === 'approved' && (
            <p style={{ color: 'green' }}>🎉 Lesson approved by both sides.</p>
          )}
        </div>
      ))}
    </div>
  );
}
