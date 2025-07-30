import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
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
        where('teacherId', '==', user.uid),
        where('status', 'in', [
          'pending-approval',
          'confirmed',
          'teacher_approved',
          'student_approved',
          'approved'
        ])
      );
      const snap = await getDocs(q);
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 1. Onay bekleyen ve tarihi geçmiş olanları en üste
      // 2. Sonra kalanları tarihe göre sırala (yeni en üstte)
      const now = new Date();
      data.sort((a, b) => {
        const aTime = new Date(a.date + ' ' + (a.startTime || '00:00'));
        const bTime = new Date(b.date + ' ' + (b.startTime || '00:00'));

        // Önce onay bekleyen ve tarihi geçmiş olanları getir
        const aWaiting = ['pending-approval', 'confirmed', 'student_approved', 'teacher_approved'].includes(a.status) && aTime < now && !a.teacherApproved;
        const bWaiting = ['pending-approval', 'confirmed', 'student_approved', 'teacher_approved'].includes(b.status) && bTime < now && !b.teacherApproved;

        if (aWaiting && !bWaiting) return -1;
        if (!aWaiting && bWaiting) return 1;
        // Kalanlar tarihi yeni olana göre sırala
        return bTime - aTime;
      });

      setBookings(data);
    }
  });
}, []);

  // Ders tamamlandı fonksiyonu (Stripe payout API üzerinden tetiklenmeli)
  const handleComplete = async (booking) => {
    const updates = { teacherApproved: true };

    if (booking.studentConfirmed) {
      updates.status = 'approved';
      updates.payoutSent = false;

      // Stripe transferi API üzerinden tetikle!
      await fetch('/api/transfer-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking })
      });
    } else {
      updates.status = 'teacher_approved';
    }

    await updateDoc(doc(db, 'bookings', booking.id), updates);

    setBookings(prev => prev.map(r =>
      r.id === booking.id ? { ...r, ...updates } : r
    ));
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
              {['pending-approval', 'confirmed', 'student_approved', 'teacher_approved'].includes(r.status)
                && isPastLesson(r.date, r.endTime)
                && !r.teacherApproved && (
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
