import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { DateTime } from 'luxon';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import SeoHead from '../../components/SeoHead';

export default function StudentLessons() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [teachers, setTeachers] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let _uid;
    onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setLoading(false);
        return;
      }
      _uid = u.uid;

      const userSnap = await getDoc(doc(db, 'users', _uid));
      if (userSnap.exists()) setUser(userSnap.data());

      const q = query(
        collection(db, 'bookings'),
        where('studentId', '==', _uid),
        where('status', 'in', ['pending-approval', 'confirmed', 'teacher_approved', 'student_approved', 'approved'])
      );
      const snap = await getDocs(q);
      const lessons = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const teacherIds = [...new Set(lessons.map(b => b.teacherId).filter(Boolean))];
      const teacherMap = {};
      await Promise.all(teacherIds.map(async id => {
        const ts = await getDoc(doc(db, 'users', id));
        if (ts.exists()) teacherMap[id] = ts.data();
      }));
      setTeachers(teacherMap);

      const notConfirmed = lessons.filter(b => !b.studentConfirmed && isPastLesson(b.date, b.endTime));
      const others = lessons.filter(b => b.studentConfirmed || !isPastLesson(b.date, b.endTime));
      notConfirmed.sort(sortByDateDesc);
      others.sort(sortByDateDesc);
      setBookings([...notConfirmed, ...others]);
      setLoading(false);
    });
  }, []);

  const confirmLesson = async (booking) => {
    try {
      const updates = { studentConfirmed: true };

      // ✅ New status logic:
      // - If booking is 'confirmed' (paid), mark as 'student_approved'
      // - Only becomes 'approved' when BOTH teacher and student confirm
      if (booking.status === 'confirmed' || booking.status === 'pending') {
        updates.status = 'student_approved';
      }

      await updateDoc(doc(db, 'bookings', booking.id), updates);
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, ...updates } : b));

      await fetch('/api/booking/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, role: 'student' }),
      });

      const latestSnap = await getDoc(doc(db, 'bookings', booking.id));
      const latest = latestSnap.data();

      if (latest?.teacherApproved && latest?.studentConfirmed) {
        await updateDoc(doc(db, 'bookings', booking.id), { status: 'approved', payoutSent: false });
        await fetch('/api/transfer-payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id }),
        });
      }
    } catch (err) {
      console.error('confirmLesson error:', err);
    }
  };

  const parseTimeTo24h = (timeStr) => {
    const [_, time, modifier] = timeStr?.match(/(\d{1,2}:\d{2})\s?(AM|PM)/i) || [];
    if (!time || !modifier) return timeStr;
    let [hours, minutes] = time.split(":");
    hours = parseInt(hours, 10);
    if (modifier.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  const isPastLesson = (dateStr, timeStr, tz) => {
    if (!timeStr) return false;
    const dt = DateTime.fromFormat(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', { zone: tz || 'UTC' });
    return DateTime.now().setZone(tz || 'UTC') > dt;
  };

  function sortByDateDesc(a, b) {
    const aTime = new Date(a.date + ' ' + (parseTimeTo24h(a.startTime) || '00:00'));
    const bTime = new Date(b.date + ' ' + (parseTimeTo24h(b.startTime) || '00:00'));
    return bTime - aTime;
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #e8eef7 0%, #d4ddf0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#64748b', fontWeight: '600', fontSize: '0.9375rem' }}>Loading lessons...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <SeoHead
        title="My Lessons"
        description="View and manage your upcoming and past lessons on BridgeLang."
      />
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #e8eef7 0%, #d4ddf0 100%)' }} className="animate-fade-in">
        {/* Header */}
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '2rem 1.5rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
              My Lessons
            </h1>
            <p style={{ fontSize: '1rem', color: '#64748b' }}>
              {bookings.length} {bookings.length === 1 ? 'lesson' : 'lessons'}
            </p>
          </div>
        </div>

        {/* Lessons List */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          {bookings.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '3rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.5rem' }}>
                No lessons yet
              </h3>
              <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '1.5rem' }}>
                Browse tutors to book your first lesson
              </p>
              <Link href="/student/teachers">
                <button style={{
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                >
                  Browse Tutors
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {bookings.map(b => {
                const t = teachers[b.teacherId] || {};

                // Calculate lesson end time properly
                const [hours, mins] = (b.startTime || '00:00').split(':').map(Number);
                const startDate = new Date(b.date);
                startDate.setHours(hours, mins, 0, 0);
                const endDate = new Date(startDate.getTime() + (b.duration || 0) * 60 * 1000);
                const now = new Date();

                const isPast = now > endDate;  // Only past if current time is after lesson end
                const needsConfirmation = isPast && !b.studentConfirmed;

                return (
                  <div key={b.id} style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Teacher */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: '#e0e7ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#4f46e5',
                        overflow: 'hidden',
                        flexShrink: '0'
                      }}>
                        {t.profilePhotoUrl ? (
                          <img src={t.profilePhotoUrl} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          (t.name || 'T').charAt(0)
                        )}
                      </div>
                      <div style={{ flex: '1', minWidth: '0' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', margin: '0 0 0.125rem 0' }}>
                          {t.name || 'Teacher'}
                        </h4>
                        <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0' }}>
                          {t.level || 'English Teacher'}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <span style={{ color: '#64748b' }}>Date:</span>
                        <span style={{ color: '#0f172a', fontWeight: '500' }}>{b.date}</span>

                        <span style={{ color: '#64748b' }}>Time:</span>
                        <span style={{ color: '#0f172a', fontWeight: '500' }}>
                          {b.startTime} — {b.endTime}
                        </span>

                        <span style={{ color: '#64748b' }}>Location:</span>
                        <span style={{ color: '#0f172a', fontWeight: '500' }}>
                          {b.location || 'Online'}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.8125rem',
                        fontWeight: '500',
                        borderRadius: '4px',
                        ...(b.status === 'approved' ?
                          { background: '#dcfce7', color: '#166534' } :
                          needsConfirmation ?
                            { background: '#fef3c7', color: '#92400e' } :
                            { background: '#dbeafe', color: '#1e40af' }
                        )
                      }}>
                        {b.status === 'approved' ? '✓ Approved' :
                          needsConfirmation ? '⏳ Confirm Attendance' :
                            b.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Meeting Link */}
                    {b.meetingLink && (
                      <a
                        href={b.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block',
                          padding: '0.75rem',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: '6px',
                          textAlign: 'center',
                          color: '#1e40af',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          textDecoration: 'none',
                          marginBottom: '1rem'
                        }}
                      >
                        Join Meeting →
                      </a>
                    )}

                    {/* Actions */}
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {needsConfirmation && (
                        <button
                          onClick={() => confirmLesson(b)}
                          style={{
                            flex: '1',
                            padding: '0.625rem',
                            background: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#16a34a'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#22c55e'}
                        >
                          I Attended
                        </button>
                      )}
                      {b.status === 'approved' && (
                        <button
                          onClick={() => router.push(`/student/review/${b.id}`)}
                          style={{
                            flex: '1',
                            padding: '0.625rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                        >
                          ✍️ Write Review
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/student/report?bookingId=${b.id}`)}
                        style={{
                          flex: needsConfirmation || b.status === 'approved' ? '0' : '1',
                          padding: '0.625rem',
                          background: 'white',
                          color: '#64748b',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.borderColor = '#94a3b8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                        }}
                      >
                        Report Issue
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
