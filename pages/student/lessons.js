import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import StudentLayout from '../../components/StudentLayout';
import SubscriptionBanner from '../../components/SubscriptionBanner';
import LoyaltyBadge from '../../components/LoyaltyBadge';

export default function StudentLessons() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [teachers, setTeachers] = useState({});

  useEffect(() => {
    let _uid;
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        _uid = user.uid;
        // Kullanıcı verisi
        const userSnap = await getDoc(doc(db, 'users', _uid));
        if (userSnap.exists()) setUser(userSnap.data());

        // Dersleri çek
        const q = query(
          collection(db, 'bookings'),
          where('studentId', '==', _uid),
          where('status', 'in', [
            'pending-approval', 'confirmed', 'teacher_approved', 'student_approved', 'approved'
          ])
        );
        const snap = await getDocs(q);
        const lessons = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Öğretmenleri toplu çek (her dersin teacherId’sini uniq listele)
        const teacherIds = [...new Set(lessons.map(b => b.teacherId).filter(Boolean))];
        const teacherMap = {};
        await Promise.all(teacherIds.map(async id => {
          const tsnap = await getDoc(doc(db, 'users', id));
          if (tsnap.exists()) teacherMap[id] = tsnap.data();
        }));
        setTeachers(teacherMap);

        // Önce "I attended" gösterilecek dersler, sonra tarihe göre
        const notConfirmed = lessons.filter(b => !b.studentConfirmed && isPastLesson(b.date, b.endTime));
        const others = lessons.filter(b => b.studentConfirmed || !isPastLesson(b.date, b.endTime));
        notConfirmed.sort(sortByDateDesc);
        others.sort(sortByDateDesc);

        setBookings([...notConfirmed, ...others]);
      }
    });
  }, []);

  const confirmLesson = async (booking) => {
    const updates = { studentConfirmed: true };

    if (booking.teacherApproved) {
      updates.status = 'approved';
      updates.payoutSent = false;

      // Stripe transferi API üzerinden tetikle!
      await fetch('/api/transfer-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking })
      });
    } else {
      updates.status = 'student_approved';
    }

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

  function sortByDateDesc(a, b) {
    const aTime = new Date(a.date + ' ' + (a.startTime || '00:00'));
    const bTime = new Date(b.date + ' ' + (b.startTime || '00:00'));
    return bTime - aTime;
  }

  return (
    <StudentLayout>
      <SubscriptionBanner />  
      {user && user.subscriptionPlan !== 'starter' && (
        <LoyaltyBadge
          plan={user.subscriptionPlan}
          loyaltyMonths={user.loyaltyMonths}
          loyaltyBonusGiven={user.loyaltyBonusGiven}
          discountEligible={user.discountEligible}
        />
      )}
      <div style={{ padding: 40 }}>
        <h2>📘 Your Lessons</h2>
        {bookings.map(b => {
          const t = teachers[b.teacherId] || {};
          return (
            <div key={b.id} style={{ border: '1px solid #ccc', margin: 10, padding: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                {t.profilePhotoUrl && (
                  <img src={t.profilePhotoUrl} alt="Teacher" width={40} height={40} style={{ borderRadius: '50%' }} />
                )}
                <div>
                  <strong>Teacher:</strong> {t.name || "-"}
                  {t.languagesTaught && <span style={{ marginLeft: 10, color: '#888', fontSize: 13 }}>({t.languagesTaught})</span>}
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <span><strong>Date:</strong> {b.date}</span>
                <span style={{ marginLeft: 20 }}><strong>Time:</strong> {b.startTime} – {b.endTime}</span>
                <span style={{ marginLeft: 20 }}><strong>Status:</strong> {b.status}</span>
              </div>
              {b.meetingLink && (
                <div style={{ marginTop: 7 }}>
                  <a href={b.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: "#2573ef" }}>
                    🔗 Join Lesson
                  </a>
                </div>
              )}
              {isPastLesson(b.date, b.endTime) && !b.studentConfirmed && (
                <button onClick={() => confirmLesson(b)} style={{ marginTop: 12 }}>
                  ✅ I attended
                </button>
              )}
              {b.status === 'approved' && (
                <p style={{ color: 'green' }}>🎉 Lesson approved by both sides.</p>
              )}
            </div>
          );
        })}
      </div>
    </StudentLayout>
  );
}
