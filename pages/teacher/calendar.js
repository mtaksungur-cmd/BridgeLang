import { useState, useEffect } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';
import { Calendar, Clock, Plus, Trash2, Save, CheckCircle2, Info } from 'lucide-react';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CalendarPage() {
  const [availability, setAvailability] = useState({});
  const [day, setDay] = useState('Monday');
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('00');
  const [msg, setMsg] = useState('');
  const [userId, setUserId] = useState('');
  const [saving, setSaving] = useState(false);
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

  const formatTime = (h, m) => `${h.padStart(2, '0')}:${m}`;

  const addSlot = () => {
    const start = formatTime(startHour, startMinute);
    const end = formatTime(endHour, endMinute);
    if (!start || !end) return;

    // Validate start < end
    const startMins = parseInt(startHour) * 60 + parseInt(startMinute);
    const endMins = parseInt(endHour) * 60 + parseInt(endMinute);
    if (startMins >= endMins) {
      setMsg('❌ End time must be after start time');
      setTimeout(() => setMsg(''), 3000);
      return;
    }

    const updated = { ...availability };
    if (!updated[day]) updated[day] = [];
    updated[day].push({ start, end });
    setAvailability(updated);
    setMsg('✅ Slot added! Don\'t forget to save.');
    setTimeout(() => setMsg(''), 2000);
  };

  const removeSlot = (d, idx) => {
    const updated = { ...availability };
    updated[d].splice(idx, 1);
    setAvailability(updated);
  };

  const saveToFirestore = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', userId), { availability });
      setMsg('✅ Availability saved successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('❌ Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const getTotalSlots = () => {
    return Object.values(availability).reduce((sum, slots) => sum + (slots?.length || 0), 0);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Calendar style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              Weekly Availability
            </h1>
          </div>
          <p style={{ fontSize: '1rem', color: '#64748b', margin: 0 }}>
            Set your availability for each day of the week. Students will see these time slots when booking lessons.
          </p>
        </div>

        {/* Info Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <Info style={{ width: '20px', height: '20px', color: '#3b82f6', flexShrink: 0, marginTop: '0.125rem' }} />
          <div>
            <p style={{ fontSize: '0.9375rem', color: '#1e40af', margin: '0 0 0.25rem 0', fontWeight: '600' }}>
              Total slots configured: <strong>{getTotalSlots()}</strong>
            </p>
            <p style={{ fontSize: '0.875rem', color: '#3b82f6', margin: 0 }}>
              Remember to click "Save Availability" after making changes.
            </p>
          </div>
        </div>

        {/* Add Slot Card */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
            Add Time Slot
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {/* Day Select */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
                Day
              </label>
              <select
                value={day}
                onChange={e => setDay(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  color: '#0f172a',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                {days.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            {/* Start Time */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
                Start Time
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={startHour}
                  onChange={e => setStartHour(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.5rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {hours.map(h => <option key={h}>{h}</option>)}
                </select>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '1.25rem', fontWeight: '700', color: '#94a3b8' }}>:</span>
                <select
                  value={startMinute}
                  onChange={e => setStartMinute(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.5rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {minutes.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* End Time */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
                End Time
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={endHour}
                  onChange={e => setEndHour(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.5rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {hours.map(h => <option key={h}>{h}</option>)}
                </select>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '1.25rem', fontWeight: '700', color: '#94a3b8' }}>:</span>
                <select
                  value={endMinute}
                  onChange={e => setEndMinute(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.5rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {minutes.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Add Button */}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={addSlot}
                style={{
                  width: '100%',
                  padding: '0.625rem 1.25rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
                onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
              >
                <Plus style={{ width: '18px', height: '18px' }} />
                Add Slot
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', marginBottom: '1.25rem' }}>
            Your Weekly Schedule
          </h3>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {days.map(d => (
              <div
                key={d}
                style={{
                  background: availability[d]?.length ? '#f8fafc' : 'white',
                  border: `1px solid ${availability[d]?.length ? '#cbd5e1' : '#e2e8f0'}`,
                  borderRadius: '10px',
                  padding: '1rem 1.25rem',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: availability[d]?.length ? '0.75rem' : 0 }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                      {d}
                    </h4>
                    {!availability[d]?.length && (
                      <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                        No availability set
                      </p>
                    )}
                  </div>
                  {availability[d]?.length > 0 && (
                    <span style={{
                      padding: '0.25rem 0.625rem',
                      background: '#dcfce7',
                      color: '#166534',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {availability[d].length} slot{availability[d].length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {availability[d]?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {availability[d].map((s, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '0.5rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem'
                        }}
                      >
                        <Clock style={{ width: '14px', height: '14px', color: '#64748b' }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#0f172a' }}>
                          {s.start} — {s.end}
                        </span>
                        <button
                          onClick={() => removeSlot(d, i)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#ef4444',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                          onMouseLeave={e => e.currentTarget.style.color = '#ef4444'}
                        >
                          <Trash2 style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save Button & Message */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <button
            onClick={saveToFirestore}
            disabled={saving}
            style={{
              padding: '0.875rem 2rem',
              background: saving ? '#94a3b8' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => !saving && (e.currentTarget.style.background = '#059669')}
            onMouseLeave={e => !saving && (e.currentTarget.style.background = '#10b981')}
          >
            {saving ? (
              <>
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite'
                }} />
                Saving...
              </>
            ) : (
              <>
                <Save style={{ width: '20px', height: '20px' }} />
                Save Availability
              </>
            )}
          </button>

          {msg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              background: msg.startsWith('✅') ? '#dcfce7' : '#fee2e2',
              color: msg.startsWith('✅') ? '#166534' : '#991b1b',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              fontWeight: '500'
            }}>
              {msg.startsWith('✅') && <CheckCircle2 style={{ width: '18px', height: '18px' }} />}
              {msg}
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
