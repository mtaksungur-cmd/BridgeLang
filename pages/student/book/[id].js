import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '../../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import StudentLayout from '../../../components/StudentLayout';
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

  // Seçili tarihteki rezervasyonlar
  useEffect(() => {
    if (!teacherId || !selectedDate) return;
    const fetchBookings = async () => {
      const q = query(
        collection(db, 'bookings'),
        where('teacherId', '==', teacherId),
        where('date', '==', selectedDate)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => doc.data());
      setBookedSlots(data);
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

  const formatToAmPm = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(mins);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const generateSlots = () => {
    if (!teacher || !selectedDate) return [];
    const day = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
    const daySlots = teacher.availability?.[day] || [];

    const result = [];
    daySlots.forEach(({ start, end }) => {
      const startMinutes = convertToMinutes(start);
      const endMinutes = convertToMinutes(end);

      for (let t = startMinutes; t + duration <= endMinutes; t += 15) {
        const isTaken = bookedSlots.some(b => convertToMinutes(b.startTime) === t);
        if (!isTaken) {
          result.push({
            start: formatToAmPm(t),
            end: formatToAmPm(t + duration),
            rawStart: t,
          });
        }
      }
    });
    setAvailableSlots(result);
  };

  useEffect(() => {
    generateSlots();
  }, [teacher, bookedSlots, duration, selectedDate]);

  const createDailyMeeting = async () => {
    const res = await fetch('/api/daily/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration }),
    });
    const data = await res.json();
    return data.url;
  };

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
      // Kredi düş
      const dec = await fetch('/api/decrement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studentId, type: 'credit' }),
      });
      const decResult = await dec.json();
      if (decResult.credits <= 0) {
        setMsg('❌ No credits left.');
        return;
      }
      setStudentCredits(decResult.credits);

      let meetingLink = '';
      if (location === 'Online') {
        meetingLink = await createDailyMeeting();
      }

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
          meetingLink,
          price: teacher[`pricing${duration}`],
          studentEmail: auth.currentUser.email
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
    <StudentLayout>
      <div className={styles.container}>
        <h2 className={styles.title}>Book a Lesson</h2>
        {teacher && <p className={styles.teacher}><span>Teacher:</span> <strong>{teacher.name}</strong></p>}

        <div className={styles.row}>
          <label className={styles.label}>
            Date
            <input
              type="date"
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
              <option value="Teacher's Home">Teacher's Home</option>
              <option value="Student's Home">Student's Home</option>
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
                  {slot.start} – {slot.end}
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
    </StudentLayout>
  );
}
