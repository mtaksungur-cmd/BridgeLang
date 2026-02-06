import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Video, AlertCircle, Settings } from 'lucide-react';
import notify from '../../lib/toast';
import LessonCountdown from '../../components/LessonCountdown';

function parseFlexibleTime(timeStr) {
  if (!timeStr) return null;
  const m = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!m) return null;
  let [, hStr, minStr, ampm] = m;
  let hour = parseInt(hStr, 10);
  const minute = parseInt(minStr, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  if (ampm) {
    const p = ampm.toUpperCase();
    if (p === 'PM' && hour !== 12) hour += 12;
    if (p === 'AM' && hour === 12) hour = 0;
  }
  return { hour, minute };
}

function getLessonEndMs(b) {
  const durMin = parseInt(b?.duration, 10) || 60;

  if (typeof b?.startAtUtc === 'number') {
    return b.startAtUtc + durMin * 60_000;
  }

  const tEnd = parseFlexibleTime(b?.endTime);
  const tStart = parseFlexibleTime(b?.startTime);
  const useStartPlusDur = !tEnd && tStart;

  if (!b?.date || (!tEnd && !tStart)) return null;

  const [y, m, d] = b.date.split('-').map(Number);

  if (useStartPlusDur) {
    const start = Date.UTC(y, (m || 1) - 1, d || 1, tStart.hour, tStart.minute);
    return start + durMin * 60_000;
  } else {
    return Date.UTC(y, (m || 1) - 1, d || 1, tEnd.hour, tEnd.minute);
  }
}

export default function TeacherLessons() {
  const [bookings, setBookings] = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push('/login');

      try {
        const q = query(collection(db, 'bookings'), where('teacherId', '==', user.uid));
        const snap = await getDocs(q);
        let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const studentIds = [...new Set(data.map((b) => b.studentId).filter(Boolean))];
        const map = {};
        await Promise.all(
          studentIds.map(async (id) => {
            const s = await getDoc(doc(db, 'users', id));
            if (s.exists()) map[id] = s.data();
          })
        );
        setStudents(map);

        const nowMs = Date.now();
        data.sort((a, b) => {
          const aEnd = getLessonEndMs(a) ?? 0;
          const bEnd = getLessonEndMs(b) ?? 0;

          const aWaiting =
            ['pending-approval', 'confirmed', 'student_approved', 'teacher_approved'].includes(a.status) &&
            aEnd &&
            nowMs > aEnd &&
            !a.teacherApproved;
          const bWaiting =
            ['pending-approval', 'confirmed', 'student_approved', 'teacher_approved'].includes(b.status) &&
            bEnd &&
            nowMs > bEnd &&
            !b.teacherApproved;

          if (aWaiting && !bWaiting) return -1;
          if (!aWaiting && bWaiting) return 1;
          return (bEnd || 0) - (aEnd || 0);
        });

        setBookings(data);
        setLoading(false);
      } catch (err) {
        console.error('Firestore query failed:', err);
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const handleApprove = async (booking) => {
    try {
      console.log('Approving booking:', booking.id);

      // Create Daily.co room
      const dailyResponse = await fetch('/api/daily/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: booking.date,
          startTime: booking.startTime,
          duration: booking.duration || 60,
          timezone: booking.timezone || 'Europe/London'
        })
      });

      if (!dailyResponse.ok) {
        throw new Error('Failed to create video room');
      }

      const { url } = await dailyResponse.json();
      console.log('Daily.co room created:', url);

      // Update booking with approval and meeting link
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'approved',
        teacherApproved: true,
        meetingLink: url
      });

      setBookings((prev) => prev.map((r) =>
        r.id === booking.id ? { ...r, status: 'approved', teacherApproved: true, meetingLink: url } : r
      ));

      notify.success('Booking approved and video room created!');
    } catch (err) {
      console.error('Approve error:', err);
      notify.error('Failed to approve: ' + err.message);
    }
  };

  const handleReject = async (booking) => {
    const reason = prompt('Rejection reason (optional, student will see this):');
    if (reason === null) return;

    if (!window.confirm('Student will receive full refund. Continue?')) return;

    try {
      console.log('Processing rejection...');

      const response = await fetch('/api/booking/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, reason: reason || 'Teacher unavailable' })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Rejection failed');
      }

      await updateDoc(doc(db, 'bookings', booking.id), { status: 'rejected', meetingLink: null });
      setBookings((prev) => prev.map((r) => r.id === booking.id ? { ...r, status: 'rejected', meetingLink: null } : r));

      notify.success('Booking rejected and student refunded!');
    } catch (err) {
      console.error('Reject error:', err);
      notify.error('Failed to reject: ' + err.message);
    }
  };

  const handleComplete = async (booking) => {
    try {
      const updates = { teacherApproved: true };

      if (booking.studentConfirmed) {
        updates.status = 'approved';
        updates.payoutSent = false;
      } else {
        updates.status = 'teacher_approved';
      }

      await updateDoc(doc(db, 'bookings', booking.id), updates);
      setBookings((prev) => prev.map((r) => (r.id === booking.id ? { ...r, ...updates } : r)));

      notify.success('✅ Lesson marked as completed!');

      await fetch('/api/booking/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          role: 'teacher',
        }),
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
      console.error('handleComplete error:', err);
      notify.error('Something went wrong confirming the lesson.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': { bg: '#fef3c7', border: '#fde047', text: '#92400e' },
      'confirmed': { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
      'approved': { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
      'rejected': { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
      'teacher_approved': { bg: '#e0e7ff', border: '#a5b4fc', text: '#3730a3' },
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
            📚 My Lessons
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#64748b', margin: 0 }}>
            Manage your bookings and upcoming lessons
          </p>
        </div>

        {bookings.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <Calendar style={{ width: '64px', height: '64px', color: '#cbd5e1', margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              No lessons yet
            </h3>
            <p style={{ fontSize: '0.9375rem', color: '#64748b', margin: 0 }}>
              Your upcoming lessons will appear here
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {bookings.map((booking) => {
              const student = students[booking.studentId] || {};
              const statusColors = getStatusColor(booking.status);

              const endMs = getLessonEndMs(booking);
              const showCompleteBtn =
                ['pending-approval', 'confirmed', 'student_approved', 'teacher_approved'].includes(booking.status) &&
                endMs &&
                Date.now() > endMs &&
                !booking.teacherApproved;

              // ✅ FIX: Show approve/reject buttons for BOTH pending AND confirmed (paid bookings)
              // Teacher must approve even if student paid
              const isPending = booking.status === 'pending' || booking.status === 'confirmed';

              return (
                <div key={booking.id} style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                    {student.profilePhotoUrl ? (
                      <Image
                        src={student.profilePhotoUrl}
                        alt={student.name || 'Student'}
                        width={56}
                        height={56}
                        style={{ borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#e0e7ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Settings style={{ width: '28px', height: '28px', color: '#4f46e5' }} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: '#2563eb',
                          margin: '0 0 0.25rem 0',
                          cursor: 'pointer'
                        }}
                        onClick={() => router.push(`/teacher/students/${booking.studentId}`)}
                      >
                        {student.name || 'Student'}
                      </h3>
                      {student.level && (
                        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                          {student.level}
                        </p>
                      )}
                    </div>
                    <div style={{
                      padding: '0.5rem 1rem',
                      background: statusColors.bg,
                      border: `1px solid ${statusColors.border}`,
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: statusColors.text,
                      textTransform: 'capitalize'
                    }}>
                      {booking.status.replace(/_/g, ' ')}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: '36px', height: '36px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Calendar style={{ width: '18px', height: '18px', color: '#2563eb' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.125rem 0' }}>Date</p>
                        <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                          {new Date(booking.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: '36px', height: '36px', background: '#f0fdf4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Clock style={{ width: '18px', height: '18px', color: '#10b981' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.125rem 0' }}>Time</p>
                        <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                          {booking.startTime} - {booking.endTime}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: '36px', height: '36px', background: '#fef3c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MapPin style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.125rem 0' }}>Location</p>
                        <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                          {booking.location || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: '36px', height: '36px', background: '#f5f3ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Clock style={{ width: '18px', height: '18px', color: '#8b5cf6' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.125rem 0' }}>Duration</p>
                        <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                          {booking.duration} minutes
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Meeting Link */}
                  {booking.meetingLink && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <a
                        href={booking.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.625rem 1rem',
                          background: '#8b5cf6',
                          color: 'white',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#7c3aed'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#8b5cf6'}
                      >
                        <Video style={{ width: '16px', height: '16px' }} />
                        Join Lesson
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleApprove(booking)}
                          style={{
                            flex: '1',
                            minWidth: '140px',
                            padding: '0.75rem 1.25rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.9375rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <CheckCircle style={{ width: '18px', height: '18px' }} />
                          Approve Booking
                        </button>
                        <button
                          onClick={() => handleReject(booking)}
                          style={{
                            flex: '1',
                            minWidth: '140px',
                            padding: '0.75rem 1.25rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.9375rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <XCircle style={{ width: '18px', height: '18px' }} />
                          Reject
                        </button>
                      </>
                    )}

                    {showCompleteBtn && (
                      <button
                        onClick={() => handleComplete(booking)}
                        style={{
                          flex: '1',
                          minWidth: '200px',
                          padding: '0.75rem 1.25rem',
                          background: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.9375rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <CheckCircle style={{ width: '18px', height: '18px' }} />
                        Confirm Lesson Completed
                      </button>
                    )}

                    {/* Show completion status only if lesson ended AND teacher confirmed */}
                    {(() => {
                      const endMs = getLessonEndMs(booking);
                      const now = Date.now();
                      const lessonEnded = endMs && now > endMs;
                      const isCompleted = booking.status === 'approved' && lessonEnded && booking.teacherApproved;

                      return isCompleted ? (
                        <div style={{
                          flex: '1',
                          padding: '0.75rem 1.25rem',
                          background: '#d1fae5',
                          border: '1px solid #6ee7b7',
                          borderRadius: '8px',
                          fontSize: '0.9375rem',
                          fontWeight: '600',
                          color: '#065f46',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <CheckCircle style={{ width: '18px', height: '18px' }} />
                          Lesson Completed
                        </div>
                      ) : null;
                    })()}

                    <button
                      onClick={() => router.push(`/teacher/report?bookingId=${booking.id}`)}
                      style={{
                        padding: '0.75rem 1.25rem',
                        background: '#f3f4f6',
                        color: '#6b7280',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <AlertCircle style={{ width: '16px', height: '16px' }} />
                      Report
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
