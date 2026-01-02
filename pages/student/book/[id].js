import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '../../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import styles from '../../../scss/BookLesson.module.scss';

export default function BookLessonPage() {
  const router = useRouter();
  const { id: teacherId } = router.query;

  const [teacher, setTeacher] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [duration, setDuration] = useState(30);
  const [location, setLocation] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [msg, setMsg] = useState('');

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setStudentId(user.uid);
      else router.replace('/login');
    });
    return () => unsub();
  }, [router]);

  /* ---------------- TEACHER ---------------- */
  useEffect(() => {
    if (!teacherId) return;
    (async () => {
      const snap = await getDoc(doc(db, 'users', teacherId));
      if (snap.exists()) setTeacher(snap.data());
    })();
  }, [teacherId]);

  /* ---------------- BOOKINGS ---------------- */
  useEffect(() => {
    if (!teacherId || !selectedDate) return;
    (async () => {
      const q = query(
        collection(db, 'bookings'),
        where('teacherId', '==', teacherId),
        where('date', '==', selectedDate)
      );
      const snap = await getDocs(q);
      setBookedSlots(snap.docs.map(d => d.data()));
    })();
  }, [teacherId, selectedDate]);

  /* ---------------- TIME HELPERS ---------------- */
  const toMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const toTime = (m) => {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };

  /* ---------------- SLOT GENERATION ---------------- */
  const generateSlots = useCallback(() => {
    if (!teacher || !selectedDate) return;

    const day = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
    const slots = Array.isArray(teacher.availability?.[day])
      ? teacher.availability[day]
      : [];

    const today = new Date();
    const selected = new Date(selectedDate);
    const result = [];

    slots.forEach(({ start, end }) => {
      let s = toMinutes(start);
      let e = end === '00:00' ? 1440 : toMinutes(end);

      for (let t = s; t + duration <= e; t += 15) {
        const taken = bookedSlots.some(b => {
          const bs = toMinutes(b.startTime);
          const be = toMinutes(b.endTime);
          return t < be && t + duration > bs;
        });

        if (selected.toDateString() === today.toDateString()) {
          const now = today.getHours() * 60 + today.getMinutes();
          if (t <= now) continue;
        }

        result.push({
          start: toTime(t),
          end: toTime(t + duration),
          taken,
        });
      }
    });

    setAvailableSlots(result);
  }, [teacher, bookedSlots, duration, selectedDate]);

  useEffect(() => {
    generateSlots();
  }, [generateSlots]);

  /* ---------------- BOOKING ---------------- */
  const handleBooking = async (slot) => {
    setMsg('');
    if (!location) return setMsg('❌ Please select a lesson location.');

    try {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          studentId,
          date: selectedDate,
          startTime: slot.start,
          endTime: slot.end,
          duration,
          location,
          price: teacher[`pricing${duration}`],
          studentEmail: auth.currentUser?.email,
          timezone: userTimezone,
        }),
      });

      const data = await res.json();

      if (data?.url) {
        if (window.fbq) {
          window.fbq('track', 'InitiateCheckout', {
            content_type: 'lesson',
            teacher_id: teacherId,
            duration,
          });
        }
        window.location.assign(data.url); // 🔥 GUARANTEED REDIRECT
      } else {
        setMsg(data?.error || '❌ Payment could not be initiated.');
      }
    } catch (err) {
      console.error('booking error:', err);
      setMsg('❌ Booking failed.');
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Book a Lesson</h2>

      {teacher && (
        <p className={styles.teacher}>
          <span>Teacher:</span> <strong>{teacher.name}</strong>
        </p>
      )}

      <div className={styles.row}>
        <label className={styles.label}>
          Date
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={styles.input}
          />
        </label>

        <label className={styles.label}>
          Lesson Duration
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={styles.select}
          >
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </label>

        <label className={styles.label}>
          Location
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={styles.select}
          >
            <option value="">-- Select --</option>
            <option value="Online">Online</option>
            <option value="Teacher&apos;s Home">Teacher&apos;s Home</option>
            <option value="Student&apos;s Home">Student&apos;s Home</option>
            <option value="Other">Other</option>
          </select>
        </label>
      </div>

      <h3 className={styles.subtitle}>Available Time Slots</h3>

      {availableSlots.length === 0 ? (
        <p className={styles.empty}>No available time slots for selected day.</p>
      ) : (
        <div className={styles.slots}>
          {availableSlots.map((slot, i) => (
            <button
              key={i}
              onClick={() => handleBooking(slot)}
              disabled={slot.taken}
              className={`${styles.slotBtn} ${slot.taken ? styles.slotBtnDisabled : ''}`}
            >
              {slot.start} – {slot.end} {slot.taken && ' (Booked)'}
            </button>
          ))}
        </div>
      )}

      {msg && <p className={styles.msg}>{msg}</p>}
    </div>
  );
}
