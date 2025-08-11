import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import TeacherLayout from '../../components/TeacherLayout';
import styles from '../../scss/TeacherLessons.module.scss';

const parseTimeTo24h = (timeStr) => {
  const [_, hourStr, minuteStr, period] = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i) || [];
  if (!hourStr) return null;
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
  if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;
  return { hour, minute };
};

const isPastLesson = (dateStr, timeStr) => {
  const t = parseTimeTo24h(timeStr);
  if (!t) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d, t.hour, t.minute);
  return new Date() > dt;
};

export default function TeacherLessons() {
  const [bookings, setBookings] = useState([]);
  const [students, setStudents] = useState({});
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push('/login');

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

      // Öğrencileri topla
      const studentIds = [...new Set(data.map(b => b.studentId).filter(Boolean))];
      const map = {};
      await Promise.all(studentIds.map(async (id) => {
        const s = await getDoc(doc(db, 'users', id));
        if (s.exists()) map[id] = s.data();
      }));
      setStudents(map);

      // Sıralama
      const now = new Date();
      data.sort((a, b) => {
        const aTime = new Date(`${a.date} ${a.startTime || '00:00'}`);
        const bTime = new Date(`${b.date} ${b.startTime || '00:00'}`);
        const aWaiting =
          ['pending-approval', 'confirmed', 'student_approved', 'teacher_approved'].includes(a.status) &&
          aTime < now && !a.teacherApproved;
        const bWaiting =
          ['pending-approval', 'confirmed', 'student_approved', 'teacher_approved'].includes(b.status) &&
          bTime < now && !b.teacherApproved;
        if (aWaiting && !bWaiting) return -1;
        if (!aWaiting && bWaiting) return 1;
        return bTime - aTime;
      });

      setBookings(data);
    });
    return () => unsub();
  }, [router]);

  const handleComplete = async (booking) => {
    const updates = { teacherApproved: true };
    if (booking.studentConfirmed) {
      updates.status = 'approved';
      updates.payoutSent = false;
      await fetch('/api/transfer-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking })
      });
    } else {
      updates.status = 'teacher_approved';
    }

    await updateDoc(doc(db, 'bookings', booking.id), updates);
    setBookings(prev => prev.map(r => (r.id === booking.id ? { ...r, ...updates } : r)));
  };

  return (
    <TeacherLayout>
      <div className={styles.container}>
        <h2 className={styles.title}>📩 Your Lessons</h2>

        {bookings.length === 0 ? (
          <p className={styles.empty}>No lessons found.</p>
        ) : (
          <div className={styles.grid}>
            {bookings.map((r) => {
              const student = students[r.studentId] || {};
              const showCompleteBtn =
                ['pending-approval', 'confirmed', 'student_approved', 'teacher_approved'].includes(r.status) &&
                isPastLesson(r.date, r.endTime) &&
                !r.teacherApproved;

              return (
                <div key={r.id} className={styles.card}>
                  <div className={styles.header}>
                    {student.profilePhotoUrl && (
                      <img
                        src={student.profilePhotoUrl}
                        alt="Student"
                        className={styles.avatar}
                      />
                    )}
                    <div className={styles.headerInfo}>
                      <div className={styles.studentName}>
                        <strong>Student:</strong> {student.name || '-'}
                      </div>
                      {student.level && (
                        <div className={styles.studentLevel}>({student.level})</div>
                      )}
                    </div>
                  </div>

                  <div className={styles.row}>
                    <span><strong>Date:</strong> {r.date}</span>
                    <span><strong>Time:</strong> {r.startTime} – {r.endTime}</span>
                  </div>

                  <div className={styles.statusRow}>
                    <span className={`${styles.badge} ${styles[`badge--${r.status}`]}`}>
                      {r.status}
                    </span>
                    {r.meetingLink && (
                      <a
                        href={r.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                      >
                        🔗 Join Lesson
                      </a>
                    )}
                  </div>

                  <div className={styles.actions}>
                    {showCompleteBtn && (
                      <button className={styles.primaryBtn} onClick={() => handleComplete(r)}>
                        🎓 Confirm Lesson Completed
                      </button>
                    )}
                    {r.status === 'approved' && (
                      <p className={styles.approved}>🎉 Lesson approved by both sides.</p>
                    )}
                    <button
                      className={styles.dangerBtn}
                      onClick={() => router.push(`/teacher/report?bookingId=${r.id}`)}
                    >
                      🛑 Report
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
