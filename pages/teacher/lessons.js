import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import styles from '../../scss/TeacherLessons.module.scss';

function parseFlexibleTime(timeStr) {
  if (!timeStr) return null;
  const m = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!m) return null;
  let [, hStr, minStr, ampm] = m;
  let hour = parseInt(hStr, 10);
  const minute = parseInt(minStr, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  if (ampm) {
    const p = ampm.toUpperCase();
    if (p === 'PM' && hour !== 12) hour += 12;
    if (p === 'AM' && hour === 12) hour = 0;
  }
  return { hour, minute };
}

function getLessonEndMs(b) {
  const durMin = parseInt(b?.duration, 10) || 60;

  if (typeof b?.startAtUtc === 'number') {
    return b.startAtUtc + durMin * 60_000;
  }

  const tEnd = parseFlexibleTime(b?.endTime);
  const tStart = parseFlexibleTime(b?.startTime);
  const useStartPlusDur = !tEnd && tStart;

  if (!b?.date || (!tEnd && !tStart)) return null;

  const [y, m, d] = b.date.split('-').map(Number);

  if (useStartPlusDur) {
    const start = Date.UTC(y, (m || 1) - 1, d || 1, tStart.hour, tStart.minute);
    return start + durMin * 60_000;
  } else {
    return Date.UTC(y, (m || 1) - 1, d || 1, tEnd.hour, tEnd.minute);
  }
}

export default function TeacherLessons() {
  const [bookings, setBookings] = useState([]);
  const [students, setStudents] = useState({});
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log("❌ No user, redirecting to login");
        return router.push('/login');
      }

      console.log("✅ Logged in as:", user.uid, "email:", user.email);

      try {
        const q = query(
          collection(db, 'bookings'),
          where('teacherId', '==', user.uid),
        );
        console.log("🔎 Running query for teacherId:", user.uid);

        const snap = await getDocs(q);
        console.log("📦 Query result count:", snap.size);

        let data = snap.docs.map(d => {
          console.log("➡️ Booking doc:", d.id, d.data());
          return { id: d.id, ...d.data() };
        });

        // Öğrenciler
        const studentIds = [...new Set(data.map(b => b.studentId).filter(Boolean))];
        console.log("👩‍🎓 Student IDs found:", studentIds);

        const map = {};
        await Promise.all(studentIds.map(async (id) => {
          const s = await getDoc(doc(db, 'users', id));
          if (s.exists()) {
            console.log("👩‍🎓 Loaded student:", id, s.data());
            map[id] = s.data();
          } else {
            console.warn("⚠️ Student not found in users:", id);
          }
        }));
        setStudents(map);

        // Sıralama
        const nowMs = Date.now();
        data.sort((a, b) => {
          const aEnd = getLessonEndMs(a) ?? 0;
          const bEnd = getLessonEndMs(b) ?? 0;

          const aWaiting =
            ['pending-approval','confirmed','student_approved','teacher_approved'].includes(a.status) &&
            aEnd && nowMs > aEnd && !a.teacherApproved;
          const bWaiting =
            ['pending-approval','confirmed','student_approved','teacher_approved'].includes(b.status) &&
            bEnd && nowMs > bEnd && !b.teacherApproved;

          if (aWaiting && !bWaiting) return -1;
          if (!aWaiting && bWaiting) return 1;
          return (bEnd || 0) - (aEnd || 0);
        });

        console.log("📊 Final sorted bookings:", data);
        setBookings(data);

      } catch (err) {
        console.error("🔥 Firestore query failed:", err);
      }
    });

    return () => unsub();
  }, [router]);

  const handleComplete = async (booking) => {
    console.log("✅ Teacher completing booking:", booking.id);
    const updates = { teacherApproved: true };

    if (booking.studentConfirmed) {
      updates.status = 'approved';
      updates.payoutSent = false;
      console.log("💰 Sending payout for booking:", booking.id);

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
    console.log("✅ Booking updated:", booking.id, updates);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>📩 Your Lessons</h2>

      {bookings.length === 0 ? (
        <p className={styles.empty}>No lessons found.</p>
      ) : (
        <div className={styles.grid}>
          {bookings.map((r) => {
            const student = students[r.studentId] || {};
            console.log("🎨 Rendering booking:", r.id, r);

            const endMs = getLessonEndMs(r);
            const showCompleteBtn =
              ['pending-approval','confirmed','student_approved','teacher_approved'].includes(r.status) &&
              endMs && Date.now() > endMs &&
              !r.teacherApproved;

            return (
              <div key={r.id} className={styles.card}>
                <div className={styles.header}>
                  {student.profilePhotoUrl && (
                    <Image
                      src={student.profilePhotoUrl}
                      alt="Student"
                      className={styles.avatar}
                      width={44}
                      height={44}
                    />
                  )}
                  <div className={styles.headerInfo}>
                    <div className={styles.studentName}>
                      <strong>Student:</strong> {student.name || '-'}
                    </div>
                    {student.level && <div className={styles.studentLevel}>({student.level})</div>}
                  </div>
                </div>

                <div className={styles.row}>
                  <span><strong>Date:</strong> {r.date}</span>
                  <span><strong>Time:</strong> {r.startTime} – {r.endTime}</span>
                </div>

                <div className={styles.row}>
                  <span><strong>Location:</strong> {r.location || 'Not specified'}</span>
                </div>

                <div className={styles.statusRow}>
                  <span className={`${styles.badge} ${styles[`badge--${r.status}`]}`}>{r.status}</span>
                  {r.meetingLink && (
                    <a href={r.meetingLink} target="_blank" rel="noopener noreferrer" className={styles.link}>
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
  );
}
