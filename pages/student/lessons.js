// pages/student/lessons.js
import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { DateTime } from 'luxon';
import SubscriptionBanner from '../../components/SubscriptionBanner';
import LoyaltyBadge from '../../components/LoyaltyBadge';
import { getLoyaltyInfo } from '../../lib/loyalty';
import styles from '../../scss/StudentLessons.module.scss';

export default function StudentLessons() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [loyalty, setLoyalty] = useState(null);
  const [teachers, setTeachers] = useState({});
  const router = useRouter();

  useEffect(() => {
    let _uid;
    onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      _uid = u.uid;

      const userSnap = await getDoc(doc(db, 'users', _uid));
      if (userSnap.exists()) setUser(userSnap.data());

      try {
        const info = await getLoyaltyInfo(_uid);
        setLoyalty(info);
      } catch (e) {
        console.error('loyalty load error:', e);
        setLoyalty(null);
      }

      const q = query(
        collection(db, 'bookings'),
        where('studentId', '==', _uid),
        where('status', 'in', ['pending-approval','confirmed','teacher_approved','student_approved','approved'])
      );
      const snap = await getDocs(q);
      const lessons = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const teacherIds = [...new Set(lessons.map(b => b.teacherId).filter(Boolean))];
      const teacherMap = {};
      await Promise.all(teacherIds.map(async id => {
        const ts = await getDoc(doc(db, 'users', id));
        if (ts.exists()) teacherMap[id] = ts.data();
      }));
      setTeachers(teacherMap);

      const notConfirmed = lessons.filter(b => !b.studentConfirmed && isPastLesson(b.date, b.endTime));
      const others = lessons.filter(b => b.studentConfirmed || !isPastLesson(b.date, b.endTime));
      notConfirmed.sort(sortByDateDesc);
      others.sort(sortByDateDesc);
      setBookings([...notConfirmed, ...others]);
    });
  }, []);

  const confirmLesson = async (booking) => {
    const updates = { studentConfirmed: true };

    if (booking.teacherApproved) {
      updates.status = 'approved';
      updates.payoutSent = false;
    } else {
      updates.status = 'student_approved';
    }

    await updateDoc(doc(db, 'bookings', booking.id), updates);
    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, ...updates } : b));
    alert('You confirmed the lesson.');

    if (updates.status === 'approved') {
      setTimeout(async () => {
        await fetch('/api/transfer-payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id })
        });
      }, 60000); // 1 dk gecikme
    }
  };

  const parseTimeTo24h = (timeStr) => {
    const [_, time, modifier] = timeStr?.match(/(\d{1,2}:\d{2})\s?(AM|PM)/i) || [];
    if (!time || !modifier) return timeStr;
    let [hours, minutes] = time.split(":");
    hours = parseInt(hours, 10);
    if (modifier.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  const isPastLesson = (dateStr, timeStr, tz) => {
    if (!timeStr) return false;
    const dt = DateTime.fromFormat(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', { zone: tz || 'UTC' });
    return DateTime.now().setZone(tz || 'UTC') > dt;
  };

  function sortByDateDesc(a, b) {
    const aTime = new Date(a.date + ' ' + (parseTimeTo24h(a.startTime) || '00:00'));
    const bTime = new Date(b.date + ' ' + (parseTimeTo24h(b.startTime) || '00:00'));
    return bTime - aTime;
  }

  return (
    <div>
      <SubscriptionBanner />

      {loyalty && loyalty.plan !== 'starter' && (
        <LoyaltyBadge
          plan={loyalty.plan}
          loyaltyMonths={loyalty.loyaltyMonths}
          loyaltyBonusCount={loyalty.loyaltyBonusCount}
          discountEligible={loyalty.discountEligible}
          promoCode={loyalty.promoCode}
        />
      )}

      <div className={`container ${styles.wrap}`}>
        <h2 className="h3 mb-4"><span className="me-2">📘</span>Your Lessons</h2>

        <div className="row g-4">
          {bookings.map(b => {
            const t = teachers[b.teacherId] || {};
            return (
              <div key={b.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                <div className={`card h-100 shadow-sm ${styles.lessonCard}`}>
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      {t.profilePhotoUrl ? (
                          <Image
                            src={t.profilePhotoUrl}
                            alt="Teacher"
                            className={styles.avatar}
                            width={44}
                            height={44}
                          />
                      ) : (
                        <div className={styles.avatarPlaceholder}>T</div>
                      )}
                      <div className="ms-3">
                        <div className="fw-semibold">Teacher: {t.name || '-'}</div>
                        <div className="text-muted small">
                          {(t.level || t.languagesTaught) ? (t.level || t.languagesTaught) : ''}
                        </div>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="small text-muted">Date:</div>
                      <div className="fw-semibold">{b.date}</div>
                    </div>
                    <div className="mb-2">
                      <div className="small text-muted">Time:</div>
                      <div className="fw-semibold">{b.startTime} — {b.endTime}</div>
                    </div>
                    <div className="mb-3">
                      <div className="small text-muted">Location:</div>
                      <div className="fw-semibold">{b.location || "Not specified"}</div>
                    </div>

                    <div className="mb-3">
                      <span className={`${styles.pill} ${b.status === 'approved' ? styles.pillApproved : styles.pillDefault}`}>
                        {b.status === 'approved' ? 'Approved' : b.status.replace('_', ' ')}
                      </span>
                    </div>

                    {b.meetingLink && (
                      <div className="mb-3">
                        <a className={styles.joinLink} href={b.meetingLink} target="_blank" rel="noopener noreferrer">
                          🔗 Join Lesson
                        </a>
                      </div>
                    )}

                    {b.status === 'approved' && (
                      <p className={`mb-3 ${styles.approvedMsg}`}>🎉 Lesson approved by both sides.</p>
                    )}

                    {isPastLesson(b.date, b.endTime, b.timezone) && !b.studentConfirmed && (
                      <button className={`btn btn-success w-100 mb-2 ${styles.confirmBtn}`} onClick={() => confirmLesson(b)}>
                        ✅ I attended
                      </button>
                    )}

                    <button
                      className={`btn w-100 ${styles.reportBtn}`}
                      onClick={() => router.push(`/student/report?bookingId=${b.id}`)}
                    >
                      🛑 Report
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
