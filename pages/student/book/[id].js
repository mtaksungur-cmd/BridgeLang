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
  const [studentCredits, setStudentCredits] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [duration, setDuration] = useState(30);
  const [location, setLocation] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [msg, setMsg] = useState('');
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Öğrenci + kredi
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setStudentId(user.uid);
        const sSnap = await getDoc(doc(db, 'users', user.uid));
        if (sSnap.exists()) setStudentCredits(sSnap.data().credits);
      }
    });
    return () => unsubscribe();
  }, []);

  // Öğretmen
  useEffect(() => {
    if (!teacherId) return;
    const fetchTeacher = async () => {
      const snap = await getDoc(doc(db, 'users', teacherId));
      if (snap.exists()) setTeacher(snap.data());
    };
    fetchTeacher();
  }, [teacherId]);

  // Rezervasyonlar
  useEffect(() => {
    if (!teacherId || !selectedDate) return;
    const fetchBookings = async () => {
      const q = query(
        collection(db, 'bookings'),
        where('teacherId', '==', teacherId),
        where('date', '==', selectedDate)
      );
      const snap = await getDocs(q);
      setBookedSlots(snap.docs.map(doc => doc.data()));
    };
    fetchBookings();
  }, [selectedDate, teacherId]);

  const convertToMinutes = (time) => {
    const [timePart, modifier] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const formatTo24Hour = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // ✅ useCallback ile dependency fix
  const generateSlots = useCallback(() => {
    if (!teacher || !selectedDate) return [];
    const day = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
    const daySlots = teacher.availability?.[day] || [];

    const result = [];
    const today = new Date();
    const selected = new Date(selectedDate);

    daySlots.forEach(({ start, end }) => {
      const startMinutes = convertToMinutes(start);
      const endMinutes = convertToMinutes(end);

      for (let t = startMinutes; t + duration <= endMinutes; t += 15) {
        const slotStart = t;
        const slotEnd = t + duration;

        const convertToMinutes = (time) => {
          if (!time) return 0;
          if (time.includes("AM") || time.includes("PM")) {
            const [timePart, modifier] = time.split(' ');
            let [hours, minutes] = timePart.split(':').map(Number);
            if (modifier === 'PM' && hours !== 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
          } else {
            // 24 saatlik format (örn: "09:00")
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
          }
        };

        if (selected.toDateString() === today.toDateString()) {
          const nowMinutes = today.getHours() * 60 + today.getMinutes();
          if (slotStart <= nowMinutes) continue;
        }

        result.push({
          start: formatTo24Hour(slotStart),
          end: formatTo24Hour(slotEnd),
          rawStart: slotStart,
          taken: isTaken
        });
      }
    });
    setAvailableSlots(result);
  }, [teacher, bookedSlots, duration, selectedDate]);

  useEffect(() => {
    generateSlots();
  }, [generateSlots]);

  const handleBooking = async (slot) => {
    setMsg('');
    if (!location) {
      setMsg('❌ Please select a lesson location.');
      return;
    }
    if (studentCredits !== null && studentCredits <= 0) {
      setMsg('❌ You have no lesson credits left. Please purchase more credits.');
      return;
    }

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
          studentEmail: auth.currentUser.email,
          timezone: userTimezone
        })
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setMsg(data.error ? `❌ ${data.error}` : '❌ Payment initiation failed.');
      }
    } catch (err) {
      console.error(err);
      setMsg('❌ Booking failed.');
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Book a Lesson</h2>
      {teacher && <p className={styles.teacher}><span>Teacher:</span> <strong>{teacher.name}</strong></p>}

      <div className={styles.row}>
        <label className={styles.label}>
          Date
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
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
            required
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
          {availableSlots.map((slot, i) => {
            const disabled =
              slot.taken ||
              !teacher ||
              !studentId ||
              !duration ||
              !location ||
              !teacher[`pricing${duration}`] ||
              !auth.currentUser ||
              (studentCredits !== null && studentCredits <= 0);

            return (
              <button
                key={i}
                onClick={() => handleBooking(slot)}
                disabled={disabled}
                className={`${styles.slotBtn} ${disabled ? styles.slotBtnDisabled : ''}`}
              >
                {slot.start} – {slot.end} {slot.taken && ' (Booked)'}
              </button>
            );
          })}
        </div>
      )}

      <p className={styles.credits}>
        <strong>Lesson Credits Left: {studentCredits !== null ? studentCredits : '-'}</strong>
      </p>

      {msg && <p className={styles.msg}>{msg}</p>}
    </div>
  );
}
