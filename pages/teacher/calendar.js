import { useState, useEffect } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CalendarPage() {
  const [availability, setAvailability] = useState({});
  const [day, setDay] = useState('Monday');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
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

  const addSlot = () => {
    if (start && end) {
      const updated = { ...availability };
      if (!updated[day]) updated[day] = [];
      updated[day].push({ start, end });
      setAvailability(updated);
      setStart('');
      setEnd('');
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

  return (
    <div style={{ maxWidth: 600, margin: 'auto', paddingTop: 40 }}>
      <h2>Weekly Lesson Availability</h2>
      <p>Select the days and times you are available to teach each week. Students will see these slots when booking.</p>

      <div style={{ marginBottom: 20 }}>
        <select value={day} onChange={(e) => setDay(e.target.value)}>
          {days.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        <button onClick={addSlot}>Add Slot</button>
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
  );
}
