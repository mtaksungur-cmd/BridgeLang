import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import {
  Calendar, MessageSquare, TrendingUp, Award, User, Clock,
  DollarSign, BookOpen, Star, ChevronRight, AlertCircle
} from 'lucide-react';
import SeoHead from '../../components/SeoHead';
import EarningsBreakdown from '../../components/EarningsBreakdown';

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push('/login');

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return router.push('/login');

        const userData = userSnap.data();
        if (userData.role !== 'teacher') return router.push('/student/dashboard');
        if (!userData?.stripeOnboarded) return router.push('/teacher/stripe-connect');

        // Fetch all bookings for analytics
        const allBookingsQ = query(
          collection(db, 'bookings'),
          where('teacherId', '==', user.uid),
          where('status', '==', 'approved')
        );
        const allBookingsSnap = await getDocs(allBookingsQ);
        const allLessons = allBookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Calculate stats
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const weeklyLessons = allLessons.filter(l => {
          const createdAt = l.createdAt?.toDate?.() || new Date(l.createdAt);
          return createdAt >= weekAgo;
        });

        const monthlyLessons = allLessons.filter(l => {
          const createdAt = l.createdAt?.toDate?.() || new Date(l.createdAt);
          return createdAt >= monthAgo;
        });

        const weeklyEarned = weeklyLessons.reduce((sum, l) => sum + (l.amountPaid || l.amount || 0), 0);
        const monthlyEarned = monthlyLessons.reduce((sum, l) => sum + (l.amountPaid || l.amount || 0), 0);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayLessons = allLessons.filter(l => {
          const createdAt = l.createdAt?.toDate?.() || new Date(l.createdAt);
          return createdAt >= todayStart;
        });
        const todayEarned = todayLessons.reduce((sum, l) => sum + (l.amountPaid || l.amount || 0), 0);
        const totalEarned = allLessons.reduce((sum, l) => sum + (l.amountPaid || l.amount || 0), 0);

        setWeeklyEarnings({ today: todayEarned, week: weeklyEarned, month: monthlyEarned, total: totalEarned });

        // Fetch upcoming lessons (simplified to avoid composite index)
        const upcomingQ = query(
          collection(db, 'bookings'),
          where('teacherId', '==', user.uid),
          limit(50)
        );
        const upcomingSnap = await getDocs(upcomingQ);
        const upcomingList = [];

        for (const docSnap of upcomingSnap.docs) {
          const booking = { id: docSnap.id, ...docSnap.data() };
          const lessonDate = new Date(booking.date);
          // ✅ FIX: Show confirmed AND approved future lessons
          if ((booking.status === 'confirmed' || booking.status === 'approved') && lessonDate > now) {
            const studentSnap = await getDoc(doc(db, 'users', booking.studentId));
            upcomingList.push({
              ...booking,
              student: studentSnap.exists() ? studentSnap.data() : { name: 'Unknown' }
            });
          }
        }

        // Sort by date and take first 3
        upcomingList.sort((a, b) => new Date(a.date) - new Date(b.date));
        setUpcomingLessons(upcomingList.slice(0, 3));

        // Fetch pending bookings (simplified to avoid composite index)
        const pendingQ = query(
          collection(db, 'bookings'),
          where('teacherId', '==', user.uid),
          limit(50)
        );
        const pendingSnap = await getDocs(pendingQ);
        const pendingList = [];

        for (const docSnap of pendingSnap.docs) {
          const booking = { id: docSnap.id, ...docSnap.data() };
          // ✅ Show bookings that need teacher approval:
          // - status 'pending' (old system)
          // - status 'confirmed' with teacherApproved false (new system)
          if (booking.status === 'pending' || (booking.status === 'confirmed' && !booking.teacherApproved)) {
            const studentSnap = await getDoc(doc(db, 'users', booking.studentId));
            pendingList.push({
              ...booking,
              student: studentSnap.exists() ? studentSnap.data() : { name: 'Unknown' }
            });
          }
        }

        // Sort by createdAt (most recent first)
        pendingList.sort((a, b) => {
          const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt || 0);
          const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt || 0);
          return dateB - dateA;
        });
        setPendingBookings(pendingList.slice(0, 5));

        // Fetch recent conversations
        const convsQ = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains', user.uid),
          limit(3)
        );
        const convsSnap = await getDocs(convsQ);
        const convList = [];
        for (const convDoc of convsSnap.docs) {
          const convData = convDoc.data();
          const otherUserId = convData.participants.find(id => id !== user.uid);
          if (otherUserId) {
            const otherUserSnap = await getDoc(doc(db, 'users', otherUserId));
            convList.push({
              id: convDoc.id,
              otherUser: otherUserSnap.exists() ? otherUserSnap.data() : { name: 'Unknown' }
            });
          }
        }
        setRecentMessages(convList);

        // Calculate avgRating from reviews
        const reviewsQ = query(collection(db, 'reviews'), where('teacherId', '==', user.uid));
        const reviewsSnap = await getDocs(reviewsQ);
        const reviews = reviewsSnap.docs.map(d => d.data());
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
          : 0;

        setData({
          ...userData,
          uid: user.uid,
          totalLessons: allLessons.length,
          avgRating,
          totalEarnings: userData.totalEarnings || 0
        });

        setLoading(false);
      } catch (error) {
        console.error('Dashboard error:', error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite'
        }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <SeoHead title="Teacher Dashboard" description="Manage your teaching on BridgeLang" />

      <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
        {/* Header */}
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '2rem 1.5rem' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                  Welcome back, {data.name}!
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                  Here's what's happening with your teaching
                </p>
              </div>
              <Link href="/account/profile">
                <button style={{
                  padding: '0.625rem 1.25rem',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#eff6ff';
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.color = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.color = '#475569';
                  }}
                >
                  <User style={{ width: '16px', height: '16px' }} />
                  Edit Profile
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Earnings Breakdown */}
          <div style={{ marginBottom: '2rem' }}>
            <EarningsBreakdown earnings={weeklyEarnings} />
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

            {/* Total Lessons */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Total Lessons</span>
                <BookOpen style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
              </div>
              <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                {data.totalLessons || 0}
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0 }}>
                All time completed
              </p>
            </div>

            {/* Average Rating */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Average Rating</span>
                <Star style={{ width: '20px', height: '20px', color: '#fbbf24', fill: '#fbbf24' }} />
              </div>
              <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                {data.avgRating ? data.avgRating.toFixed(1) : '0.0'}
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0 }}>
                Based on student reviews
              </p>
            </div>

            {/* Pending Requests */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Pending Requests</span>
                <AlertCircle style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
              </div>
              <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                {pendingBookings.length}
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0 }}>
                Awaiting your response
              </p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

            {/* Upcoming Lessons */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>Upcoming Lessons</h3>
                <Calendar style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </div>

              {upcomingLessons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <Clock style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                  <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>No upcoming lessons</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {upcomingLessons.map(lesson => (
                    <div key={lesson.id} style={{
                      padding: '0.875rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>
                          {lesson.student?.name || 'Student'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {lesson.duration}min
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        {new Date(lesson.date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                  <Link href="/teacher/bookings">
                    <button style={{
                      marginTop: '0.5rem',
                      width: '100%',
                      padding: '0.625rem',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem',
                      transition: 'all 0.2s'
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#eff6ff';
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.color = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.color = '#475569';
                      }}
                    >
                      View All
                      <ChevronRight style={{ width: '14px', height: '14px' }} />
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Pending Booking Requests */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>Booking Requests</h3>
                <AlertCircle style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
              </div>

              {pendingBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <Award style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                  <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>No pending requests</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {pendingBookings.slice(0, 3).map(booking => (
                    <div key={booking.id} style={{
                      padding: '0.875rem',
                      background: '#fef3c7',
                      borderRadius: '8px',
                      border: '1px solid #fde047'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>
                          {booking.student?.name || 'Student'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: '600' }}>
                          £{(booking.amountPaid || 0).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#78350f', marginBottom: '0.5rem' }}>
                        {booking.duration}min · {new Date(booking.date).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  ))}
                  <Link href="/teacher/lessons">
                    <button style={{
                      marginTop: '0.5rem',
                      width: '100%',
                      padding: '0.625rem',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(59,130,246,0.25)'
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.35)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.25)';
                      }}
                    >
                      Review Requests
                      <ChevronRight style={{ width: '14px', height: '14px' }} />
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Messages */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>Recent Messages</h3>
                <MessageSquare style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </div>

              {recentMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <MessageSquare style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                  <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>No messages yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recentMessages.map(conv => (
                    <div key={conv.id} style={{
                      padding: '0.875rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                      onClick={() => router.push('/teacher/chats')}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          flexShrink: 0
                        }}>
                          {(conv.otherUser?.name || 'S')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {conv.otherUser?.name || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                            Student
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Link href="/teacher/chats">
                    <button style={{
                      marginTop: '0.5rem',
                      width: '100%',
                      padding: '0.625rem',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem',
                      transition: 'all 0.2s'
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#eff6ff';
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.color = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.color = '#475569';
                      }}
                    >
                      View All Messages
                      <ChevronRight style={{ width: '14px', height: '14px' }} />
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', marginBottom: '1.25rem' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <Link href="/account/profile">
                <button style={{
                  width: '100%',
                  padding: '1rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#eff6ff';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <User style={{ width: '20px', height: '20px', color: '#3b82f6', marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>
                    Edit Profile
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    Update your info
                  </div>
                </button>
              </Link>

              <Link href="/teacher/bookings">
                <button style={{
                  width: '100%',
                  padding: '1rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#eff6ff';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <Calendar style={{ width: '20px', height: '20px', color: '#3b82f6', marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>
                    Manage Bookings
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    View all lessons
                  </div>
                </button>
              </Link>

              <Link href="/teacher/chats">
                <button style={{
                  width: '100%',
                  padding: '1rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#eff6ff';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <MessageSquare style={{ width: '20px', height: '20px', color: '#3b82f6', marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>
                    Messages
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    Chat with students
                  </div>
                </button>
              </Link>

              <Link href="/account/settings">
                <button style={{
                  width: '100%',
                  padding: '1rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#eff6ff';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <User style={{ width: '20px', height: '20px', color: '#3b82f6', marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>
                    Settings
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    Account preferences
                  </div>
                </button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
