import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '../../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import StudentLayout from '../../../components/StudentLayout';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setStudentId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!teacherId) return;
    const fetchTeacher = async () => {
      const snap = await getDoc(doc(db, 'users', teacherId));
      if (snap.exists()) setTeacher(snap.data());
    };
    fetchTeacher();
  }, [teacherId]);

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
    if (!location) {
      setMsg('❌ Please select a lesson location.');
      return;
    }
    try {
      let meetingLink = '';
      if (location === 'Online') {
        meetingLink = await createDailyMeeting();
      }

      await addDoc(collection(db, 'bookings'), {
        studentId,
        teacherId,
        date: selectedDate,
        startTime: slot.start,
        endTime: slot.end,
        duration,
        location,
        meetingLink,
        status: 'requested',
        createdAt: Timestamp.now()
      });
      setMsg('✅ Lesson booked successfully!');
    } catch (err) {
      console.error(err);
      setMsg('❌ Booking failed.');
    }
  };

  return (
    <StudentLayout>
    <div style={{ padding: 40 }}>
      <h2>Book a Lesson</h2>
      {teacher && <p>Teacher: <strong>{teacher.name}</strong></p>}

      <label>Date: <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} /></label><br /><br />

      <label>Lesson Duration: </label>
      <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
        <option value={30}>30 minutes</option>
        <option value={45}>45 minutes</option>
        <option value={60}>60 minutes</option>
      </select><br /><br />

      <label>Location: </label>
      <select value={location} onChange={(e) => setLocation(e.target.value)} required>
        <option value="">-- Select --</option>
        <option value="Online">Online</option>
        <option value="Teacher's Home">Teacher's Home</option>
        <option value="Student's Home">Student's Home</option>
        <option value="Other">Other</option>
      </select><br /><br />

      <h3>Available Time Slots</h3>
      {availableSlots.length === 0 ? (
        <p>No available time slots for selected day.</p>
      ) : (
        availableSlots.map((slot, i) => (
          <button key={i} onClick={() => handleBooking(slot)} style={{ margin: 5 }}>
            {slot.start} – {slot.end}
          </button>
        ))
      )}

      {msg && <p style={{ marginTop: 20, color: 'green' }}>{msg}</p>}
    </div>
    </StudentLayout>
  );
}
