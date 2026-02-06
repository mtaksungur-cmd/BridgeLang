import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '../../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Calendar as CalendarIcon, Clock, MapPin, CreditCard, CheckCircle2, AlertCircle, ChevronLeft, Home, Video, Navigation, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function BookLessonPage() {
  const router = useRouter();
  const { id: teacherId } = router.query;

  const [teacher, setTeacher] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [duration, setDuration] = useState(null);
  const [location, setLocation] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Dynamic location options based on teacher's supported locations
  const getLocationOptions = () => {
    if (!teacher) return [];

    // Default to online only if teachingLocations not set (for backward compatibility)
    const allowedLocations = teacher.teachingLocations || ['Online'];

    const allOptions = [
      { value: 'Online', label: 'Online', sublabel: 'Video Call', icon: Video },
      { value: "Teacher's Home", label: "Teacher's Location", sublabel: 'In-person', icon: Home },
      { value: "Student's Home", label: 'My Location', sublabel: 'In-person', icon: Home },
      { value: 'Other', label: 'Other Location', sublabel: 'Custom', icon: Navigation }
    ];

    // Filter to only show teacher's supported locations
    return allOptions.filter(opt => allowedLocations.includes(opt.value));
  };

  const getDurationOptions = () => {
    if (!teacher) return [];

    const allOptions = [
      { value: 15, label: '15 min', price: '£4.99', isIntro: true },
      { value: 30, label: '30 min', price: teacher.pricing30 ? `£${teacher.pricing30}` : null },
      { value: 45, label: '45 min', price: teacher.pricing45 ? `£${teacher.pricing45}` : null },
      { value: 60, label: '60 min', price: teacher.pricing60 ? `£${teacher.pricing60}` : null }
    ];

    // Only show options with valid pricing
    return allOptions.filter(opt => opt.isIntro || opt.price !== null);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setStudentId(user.uid);
      else router.replace('/login');
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!teacherId) return;
    (async () => {
      const snap = await getDoc(doc(db, 'users', teacherId));
      if (snap.exists()) setTeacher(snap.data());
    })();
  }, [teacherId]);

  // Set default duration when teacher loads
  useEffect(() => {
    if (!teacher || duration !== null) return;
    const options = getDurationOptions();
    if (options.length > 0) {
      setDuration(options[0].value);
    }
  }, [teacher, duration]);

  useEffect(() => {
    if (!teacherId || !selectedDate) return;
    (async () => {
      // Only fetch confirmed/approved bookings to check availability
      // This prevents abandoned/unpaid bookings from blocking slots
      const q = query(
        collection(db, 'bookings'),
        where('teacherId', '==', teacherId),
        where('date', '==', selectedDate),
        where('status', '==', 'pending') // Only confirmed bookings
      );
      const snap = await getDocs(q);
      setBookedSlots(snap.docs.map(d => d.data()));
    })();
  }, [teacherId, selectedDate]);

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

  const handleProceedToPayment = async () => {
    setMsg('');
    if (!selectedSlot) {
      setMsg('Please select a time slot');
      return;
    }
    if (!location) {
      setMsg('Please select a lesson location');
      return;
    }

    setLoading(true);
    try {
      console.log('📤 Sending booking request:', {
        teacherId,
        studentId,
        date: selectedDate,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        duration,
        location,
        price: duration === 15 ? 4.99 : teacher[`pricing${duration}`],
      });

      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          studentId,
          date: selectedDate,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
          duration,
          location,
          price: duration === 15 ? 4.99 : teacher[`pricing${duration}`],
          studentEmail: auth.currentUser?.email,
          timezone: userTimezone,
        }),
      });

      console.log('📥 Response status:', res.status);
      const data = await res.json();
      console.log('📥 Response data:', data);

      if (data?.url) {
        if (window.fbq) {
          window.fbq('track', 'InitiateCheckout', {
            content_type: 'lesson',
            teacher_id: teacherId,
            duration,
          });
        }
        window.location.assign(data.url);
      } else {
        setMsg(data?.error || 'Payment could not be initiated');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Booking error:', err);
      setMsg('Booking failed. Please try again.');
      setLoading(false);
    }
  };

  const getPrice = () => {
    if (duration === 15) return '£4.99';
    return teacher?.[`pricing${duration}`] ? `£${teacher[`pricing${duration}`]}` : '—';
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const formatDateToInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateClick = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date >= today) {
      setSelectedDate(formatDateToInput(date));
    }
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} style={{ padding: '0.75rem' }} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isPast = date < today;
      const isSelected = selectedDate === formatDateToInput(date);

      days.push(
        <button
          key={day}
          onClick={() => !isPast && handleDateClick(day)}
          disabled={isPast}
          style={{
            padding: '0.875rem',
            border: 'none',
            background: isSelected ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
            color: isPast ? '#cbd5e1' : isSelected ? 'white' : '#0f172a',
            borderRadius: '10px',
            cursor: isPast ? 'not-allowed' : 'pointer',
            fontWeight: isSelected ? '700' : '500',
            fontSize: '0.9375rem',
            boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.25)' : 'none'
          }}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Link href={`/student/teacher/${teacherId}`}>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#64748b',
            cursor: 'pointer',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
            Back to Profile
          </button>
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
          {/* Main Content */}
          <div>
            {/* Date Selection */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2.5rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #bfdbfe'
                }}>
                  <CalendarIcon style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Select Date
                </h3>
              </div>

              {/* Calendar */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                  borderRadius: '16px',
                  padding: '2rem',
                  border: '2px solid #f1f5f9'
                }}>
                  {/* Month Navigation */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      style={{
                        padding: '0.625rem 1.25rem',
                        background: 'white',
                        border: '2px solid #e2e8f0',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '1.125rem',
                        color: '#64748b'
                      }}
                    >
                      ←
                    </button>
                    <div style={{ fontWeight: '700', fontSize: '1.25rem', color: '#0f172a' }}>
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      style={{
                        padding: '0.625rem 1.25rem',
                        background: 'white',
                        border: '2px solid #e2e8f0',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '1.125rem',
                        color: '#64748b'
                      }}
                    >
                      →
                    </button>
                  </div>

                  {/* Day Labels */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} style={{ textAlign: 'center', fontSize: '0.8125rem', fontWeight: '700', color: '#64748b', padding: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                    {renderCalendar()}
                  </div>
                </div>
              </div>

              {/* Date Display */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: '#475569', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Selected Date
                </label>
                <div style={{
                  padding: '1.25rem 1.5rem',
                  background: selectedDate ? 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)' : '#f8fafc',
                  border: `3px solid ${selectedDate ? '#3b82f6' : '#e2e8f0'}`,
                  borderRadius: '14px',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: selectedDate ? '#1e40af' : '#94a3b8',
                  textAlign: 'center',
                  letterSpacing: '0.5px'
                }}>
                  {selectedDate ? formatDateDisplay(selectedDate) : 'dd/mm/yyyy'}
                </div>
              </div>
            </div>

            {/* Duration Selection */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #86efac'
                }}>
                  <Clock style={{ width: '20px', height: '20px', color: '#10b981' }} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Select Duration
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {getDurationOptions().map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDuration(option.value)}
                    style={{
                      padding: '1.25rem 1rem',
                      background: duration === option.value ? 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)' : 'white',
                      border: `2px solid ${duration === option.value ? '#3b82f6' : '#f1f5f9'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      boxShadow: duration === option.value ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 2px 4px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: duration === option.value ? '#1e40af' : '#0f172a', marginBottom: '0.5rem' }}>
                      {option.label}
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: duration === option.value ? '#3b82f6' : '#10b981',
                      padding: '0.375rem 0.75rem',
                      background: duration === option.value ? 'rgba(59, 130, 246, 0.1)' : '#f0fdf4',
                      borderRadius: '6px',
                      display: 'inline-block'
                    }}>
                      {option.price}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Location Selection */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #fcd34d'
                }}>
                  <MapPin style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Select Location
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {getLocationOptions().map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setLocation(option.value)}
                      style={{
                        padding: '1.25rem',
                        background: location === option.value ? 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)' : 'white',
                        border: `2px solid ${location === option.value ? '#3b82f6' : '#f1f5f9'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        boxShadow: location === option.value ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 2px 4px rgba(0,0,0,0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          background: location === option.value ? '#3b82f6' : '#f1f5f9',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon style={{ width: '18px', height: '18px', color: location === option.value ? 'white' : '#64748b' }} />
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>
                          {option.label}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b', marginLeft: '2.75rem' }}>
                        {option.sublabel}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Available Slots */}
            {selectedDate && (
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '2.5rem',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #d8b4fe'
                  }}>
                    <Clock style={{ width: '24px', height: '24px', color: '#8b5cf6' }} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Available Time Slots
                  </h3>
                </div>

                {availableSlots.length === 0 ? (
                  <div style={{
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '16px',
                    border: '3px dashed #cbd5e1'
                  }}>
                    <AlertCircle style={{ width: '56px', height: '56px', color: '#94a3b8', margin: '0 auto 1.5rem' }} />
                    <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#64748b', margin: '0 0 0.5rem 0' }}>
                      No Slots Available
                    </p>
                    <p style={{ fontSize: '1rem', color: '#94a3b8', margin: 0 }}>
                      Try selecting a different date
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.875rem' }}>
                    {availableSlots.map((slot, i) => (
                      <button
                        key={i}
                        onClick={() => !slot.taken && !loading && setSelectedSlot(slot)}
                        disabled={slot.taken || loading}
                        style={{
                          padding: '1.125rem 0.875rem',
                          background: selectedSlot?.start === slot.start
                            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                            : (slot.taken ? '#f8fafc' : 'white'),
                          border: `2px solid ${selectedSlot?.start === slot.start ? '#3b82f6' : (slot.taken ? '#e2e8f0' : '#f1f5f9')}`,
                          borderRadius: '10px',
                          cursor: slot.taken || loading ? 'not-allowed' : 'pointer',
                          textAlign: 'center',
                          boxShadow: selectedSlot?.start === slot.start ? '0 4px 12px rgba(59, 130, 246, 0.25)' : 'none'
                        }}
                      >
                        <Clock style={{
                          width: '18px',
                          height: '18px',
                          color: selectedSlot?.start === slot.start ? 'white' : (slot.taken ? '#cbd5e1' : '#64748b'),
                          margin: '0 auto 0.5rem'
                        }} />
                        <div style={{
                          fontSize: '1.125rem',
                          fontWeight: '800',
                          color: selectedSlot?.start === slot.start ? 'white' : (slot.taken ? '#94a3b8' : '#0f172a'),
                          marginBottom: '0.375rem',
                          letterSpacing: '-0.5px'
                        }}>
                          {slot.start}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: selectedSlot?.start === slot.start ? 'rgba(255,255,255,0.9)' : (slot.taken ? '#cbd5e1' : '#10b981'),
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {slot.taken ? 'Booked' : selectedSlot?.start === slot.start ? 'Selected' : 'Available'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {msg && (
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem 2rem',
                background: msg.includes('successfully') ? 'linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)' : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                border: `3px solid ${msg.includes('successfully') ? '#86efac' : '#fca5a5'}`,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: msg.includes('successfully') ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 4px 12px rgba(239, 68, 68, 0.2)'
              }}>
                {msg.includes('successfully') ? (
                  <CheckCircle2 style={{ width: '28px', height: '28px', color: '#166534' }} />
                ) : (
                  <AlertCircle style={{ width: '28px', height: '28px', color: '#991b1b' }} />
                )}
                <span style={{ fontSize: '1rem', fontWeight: '600', color: msg.includes('successfully') ? '#166534' : '#991b1b' }}>
                  {msg}
                </span>
              </div>
            )}
          </div>

          {/* Sidebar - Booking Summary */}
          <div>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2.5rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0',
              position: 'sticky',
              top: '2rem'
            }}>
              <h3 style={{ fontSize: '1.375rem', fontWeight: '700', color: '#0f172a', marginBottom: '2rem' }}>
                Booking Summary
              </h3>

              {teacher && (
                <div style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  border: '2px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '14px',
                      background: teacher.profilePhotoUrl
                        ? `url(${teacher.profilePhotoUrl}) center/cover`
                        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: '3px solid white',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                    }} />
                    <div>
                      <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0f172a' }}>
                        {teacher.name}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '2px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#64748b' }}>Date</span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#0f172a' }}>
                    {selectedDate ? formatDateDisplay(selectedDate) : '—'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '2px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#64748b' }}>Duration</span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#0f172a' }}>
                    {duration} minutes
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '2px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#64748b' }}>Location</span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#0f172a' }}>
                    {location || '—'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '2px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#64748b' }}>Time Slot</span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#0f172a' }}>
                    {selectedSlot ? `${selectedSlot.start} - ${selectedSlot.end}` : '—'}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)',
                  borderRadius: '14px',
                  marginTop: '0.5rem',
                  border: '2px solid #86efac'
                }}>
                  <span style={{ fontSize: '1rem', fontWeight: '700', color: '#166534' }}>Total Price</span>
                  <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#166534' }}>
                    {getPrice()}
                  </span>
                </div>

                {/* Proceed to Payment Button */}
                {selectedDate && duration && location && selectedSlot && (
                  <button
                    onClick={handleProceedToPayment}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '1.25rem',
                      background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: 'none',
                      borderRadius: '14px',
                      color: 'white',
                      fontSize: '1.0625rem',
                      fontWeight: '700',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      marginTop: '0.5rem',
                      boxShadow: loading ? 'none' : '0 8px 20px rgba(59, 130, 246, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      letterSpacing: '0.3px'
                    }}
                  >
                    {loading ? (
                      'Processing...'
                    ) : (
                      <>
                        Proceed to Payment
                        <ArrowRight style={{ width: '20px', height: '20px' }} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
