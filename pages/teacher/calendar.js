import { useState, useEffect } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';
import TeacherLayout from '../../components/TeacherLayout';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CalendarPage() {
  const [availability, setAvailability] = useState({});
  const [day, setDay] = useState('Monday');
  const [startHour, setStartHour] = useState('9');
  const [startMinute, setStartMinute] = useState('00');
  const [startAMPM, setStartAMPM] = useState('AM');
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('00');
  const [endAMPM, setEndAMPM] = useState('AM');
  const [msg, setMsg] = useState('');
  const [userId, setUserId] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.uid);
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setAvailability(data.availability || {});
      }
    });
    return () => unsubscribe();
  }, []);

  const formatTime = (h, m, ampm) => {
    const hh = h.padStart(2, '0');
    return `${hh}:${m} ${ampm}`;
  };

  const addSlot = () => {
    const start = formatTime(startHour, startMinute, startAMPM);
    const end = formatTime(endHour, endMinute, endAMPM);
    if (start && end) {
      const updated = { ...availability };
      if (!updated[day]) updated[day] = [];
      updated[day].push({ start, end });
      setAvailability(updated);
    }
  };

  const removeSlot = (day, index) => {
    const updated = { ...availability };
    updated[day].splice(index, 1);
    setAvailability(updated);
  };

  const saveToFirestore = async () => {
    try {
      await updateDoc(doc(db, 'users', userId), { availability });
      setMsg('✅ Availability saved successfully.');
    } catch (err) {
      setMsg('❌ Error: ' + err.message);
    }
  };

  const hours = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
  const minutes = ['00', '15', '30', '45'];
  const ampm = ['AM', 'PM'];

  return (
    <TeacherLayout>
    <div style={{ maxWidth: 600, margin: 'auto', paddingTop: 40 }}>
      <h2>Weekly Lesson Availability</h2>
      <p>Select the days and times you are available to teach each week. Students will see these slots when booking.</p>

      <div style={{ marginBottom: 20 }}>
        <select value={day} onChange={(e) => setDay(e.target.value)}>
          {days.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <span style={{ marginLeft: 10 }}>Start:</span>
        <select value={startHour} onChange={(e) => setStartHour(e.target.value)}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
        <select value={startMinute} onChange={(e) => setStartMinute(e.target.value)}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
        <select value={startAMPM} onChange={(e) => setStartAMPM(e.target.value)}>{ampm.map(a => <option key={a} value={a}>{a}</option>)}</select>

        <span style={{ marginLeft: 10 }}>End:</span>
        <select value={endHour} onChange={(e) => setEndHour(e.target.value)}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
        <select value={endMinute} onChange={(e) => setEndMinute(e.target.value)}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
        <select value={endAMPM} onChange={(e) => setEndAMPM(e.target.value)}>{ampm.map(a => <option key={a} value={a}>{a}</option>)}</select>

        <button onClick={addSlot} style={{ marginLeft: 10 }}>Add Slot</button>
      </div>

      {days.map((d) => (
        <div key={d} style={{ marginBottom: 10 }}>
          <strong>{d}:</strong>{' '}
          {availability[d]?.length > 0 ? (
            availability[d].map((slot, idx) => (
              <div key={idx}>
                {slot.start} - {slot.end}
                <button onClick={() => removeSlot(d, idx)} style={{ marginLeft: 10 }}>Remove</button>
              </div>
            ))
          ) : (
            <span>No availability</span>
          )}
        </div>
      ))}

      <button onClick={saveToFirestore} style={{ marginTop: 20 }}>Save Availability</button>
      {msg && <p>{msg}</p>}
    </div>
    </TeacherLayout>
  );
}
