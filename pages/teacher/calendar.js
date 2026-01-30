import { useState, useEffect } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';
import styles from '../../scss/TeacherCalendar.module.scss';

const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function CalendarPage() {
  const [availability, setAvailability] = useState({});
  const [day, setDay] = useState('Monday');
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('00');
  const [msg, setMsg] = useState('');
  const [userId, setUserId] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push('/login');
      setUserId(user.uid);
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setAvailability(data.availability || {});
        if (!data?.stripeOnboarded) return router.push('/teacher/stripe-connect');
      }
    });
    return () => unsub();
  }, [router]);

  const formatTime = (h, m) => `${h.padStart(2,'0')}:${m}`;

  const addSlot = () => {
    const start = formatTime(startHour, startMinute);
    const end   = formatTime(endHour, endMinute);
    if (!start || !end) return;
    const updated = { ...availability };
    if (!updated[day]) updated[day] = [];
    updated[day].push({ start, end });
    setAvailability(updated);
  };

  const removeSlot = (d, idx) => {
    const updated = { ...availability };
    updated[d].splice(idx, 1);
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

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2,'0'));
  const minutes = ['00','15','30','45'];

  return (
      <div className={styles.wrap}>
        <h2 className={styles.title}>Weekly Lesson Availability</h2>
        <p className={styles.subtitle}>
          Select the days and times you’re available. Students will see these slots when booking.
        </p>

        {/* Controls */}
        <div className={`row g-2 ${styles.controls}`}>
          <div className="col-12 col-md-3">
            <label className="form-label">Day</label>
            <select value={day} onChange={e=>setDay(e.target.value)} className="form-select">
              {days.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label">Start</label>
            <div className="d-flex gap-2">
              <select value={startHour} onChange={e=>setStartHour(e.target.value)} className="form-select">
                {hours.map(h => <option key={h}>{h}</option>)}
              </select>
              <select value={startMinute} onChange={e=>setStartMinute(e.target.value)} className="form-select">
                {minutes.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label">End</label>
            <div className="d-flex gap-2">
              <select value={endHour} onChange={e=>setEndHour(e.target.value)} className="form-select">
                {hours.map(h => <option key={h}>{h}</option>)}
              </select>
              <select value={endMinute} onChange={e=>setEndMinute(e.target.value)} className="form-select">
                {minutes.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="col-12 col-md-1 d-flex align-items-end">
            <button onClick={addSlot} className="btn btn-primary w-100">Add</button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableCard}>
          <table className={`table ${styles.table}`}>
            <thead>
              <tr>
                <th>Day</th>
                <th>Slots</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {days.map(d => (
                <tr key={d}>
                  <td className={styles.dayCell}>{d}</td>
                  <td>
                    {availability[d]?.length ? (
                      <ul className={styles.slotList}>
                        {availability[d].map((s, i) => (
                          <li key={i} className={styles.slot}>
                            <span>{s.start} — {s.end}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted">No availability</span>
                    )}
                  </td>
                  <td className="text-end">
                    {availability[d]?.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => removeSlot(d, i)}
                        className="btn btn-danger btn-sm ms-1"
                      >
                        Remove #{i + 1}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Save */}
        <div className="d-flex align-items-center gap-3 mt-3">
          <button onClick={saveToFirestore} className="btn btn-success">Save Availability</button>
          {msg && <span className={msg.startsWith('✅') ? styles.msgOk : styles.msgErr}>{msg}</span>}
        </div>
      </div>
  );
}
