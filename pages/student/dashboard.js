import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, limit, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { useSubscriptionGuard } from '../../lib/subscriptionGuard';
import {
  BookOpen, Clock, Zap, Calendar, MessageCircle, TrendingUp, Search,
  Target, Award, ChevronRight, Flame, Settings, Star
} from 'lucide-react';
import SeoHead from '../../components/SeoHead';
import WelcomeBanner from '../../components/WelcomeBanner';
import StudentProgress from '../../components/StudentProgress';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [recentTeachers, setRecentTeachers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const router = useRouter();

  const activeUntilMillis =
    data?.subscription?.activeUntil?._seconds
      ? data.subscription.activeUntil._seconds * 1000
      : (data?.subscription?.activeUntilMillis || null);
  useSubscriptionGuard({ plan: data?.subscriptionPlan, activeUntilMillis, graceDays: 0 });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (!userSnap.exists()) {
          router.push('/login');
          return;
        }

        const userData = userSnap.data();
        if (userData.role !== 'student') {
          router.push('/teacher/dashboard');
          return;
        }

        if (!userData.emailVerified && user.emailVerified) {
          await updateDoc(doc(db, 'users', user.uid), { emailVerified: true });
          userData.emailVerified = true;
        }

        // Check if user just upgraded (show welcome banner)
        if (userData.justUpgraded && userData?.justUpgraded) {
          setShowWelcome(true);
          // Clear flag after showing
          await updateDoc(doc(db, 'users', user.uid), { justUpgraded: false });
        }

        setData(userData);

        // Fetch upcoming lessons with proper Firestore query
        const bookingsRef = collection(db, 'bookings');
        const lessonsQ = query(
          bookingsRef,
          where('studentId', '==', user.uid),
          where('status', 'in', ['pending', 'pending-approval', 'confirmed', 'teacher_approved', 'student_approved', 'approved']),
          limit(20)
        );
        const lessonsSnap = await getDocs(lessonsQ);

        console.log('📚 Total bookings found:', lessonsSnap.docs.length);

        const now = new Date();
        const approvedLessons = lessonsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(lesson => {
            console.log('🔍 Checking lesson:', {
              id: lesson.id,
              status: lesson.status,
              date: lesson.date,
              studentId: lesson.studentId
            });

            // More flexible date parsing
            const lessonDate = new Date(lesson.date);
            const isFutureLesson = lessonDate > now;

            console.log(`  → Status: ${lesson.status}`);
            console.log(`  → Date: ${lesson.date} → ${lessonDate.toISOString()}`);
            console.log(`  → Is future? ${isFutureLesson}`);
            console.log(`  → Will show? ${isFutureLesson}`);

            return isFutureLesson;
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        console.log('✅ Approved future lessons:', approvedLessons.length);

        // Get teacher data for upcoming lessons
        const upcomingWithTeachers = await Promise.all(
          approvedLessons.slice(0, 3).map(async (lesson) => {
            const teacherSnap = await getDoc(doc(db, 'users', lesson.teacherId));
            return {
              ...lesson,
              teacher: teacherSnap.exists() ? teacherSnap.data() : { name: 'Unknown' }
            };
          })
        );
        setUpcomingLessons(upcomingWithTeachers);

        // Get recent teachers (from completed lessons)
        const completedLessons = lessonsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(lesson => lesson.status === 'approved')
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        const teacherIds = [...new Set(completedLessons.map(l => l.teacherId))];
        const recentTeacherData = await Promise.all(
          teacherIds.slice(0, 3).map(async (teacherId) => {
            const teacherSnap = await getDoc(doc(db, 'users', teacherId));
            return {
              id: teacherId,
              ...teacherSnap.data()
            };
          })
        );
        setRecentTeachers(recentTeacherData);

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
        setConversations(convList);

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

  const plan = data.subscriptionPlan || 'free';
  const totalLessons = data.totalLessonsCompleted || 0;
  const currentStreak = data.learningStreak || 0;

  // Calculate messages left
  const planLimits = { free: 5, starter: 10, pro: 20, vip: Infinity };
  const planLimit = planLimits[plan] || 5;
  const messagesLeft = plan === 'vip' ? Infinity : (data.messagesLeft ?? planLimit);

  // Next lesson countdown
  const nextLesson = upcomingLessons[0];
  const getTimeUntilLesson = () => {
    if (!nextLesson) return null;
    const now = new Date();
    const lessonDate = new Date(nextLesson.date);
    const diffMs = lessonDate - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    return 'Soon';
  };

  return (
    <>
      <SeoHead title="Student Dashboard" description="Your learning dashboard on BridgeLang" />

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
                  Continue your learning journey
                </p>
              </div>
              <Link href="/account/settings">
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
                  <Settings style={{ width: '16px', height: '16px' }} />
                  Settings
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Welcome Banner for New Subscriptions */}
          {showWelcome && data?.subscriptionPlan && (
            <WelcomeBanner
              plan={data.subscriptionPlan}
              onDismiss={() => setShowWelcome(false)}
            />
          )}

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Total Lessons */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Total Lessons</span>
                <BookOpen style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
              </div>
              <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                {totalLessons}
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0 }}>
                Completed so far
              </p>
            </div>

            {/* Learning Streak */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Learning Streak</span>
                <Flame style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
              </div>
              <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                {currentStreak} days
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0 }}>
                Keep it up!
              </p>
            </div>

            {/* Messages Left */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Messages Left</span>
                <MessageCircle style={{ width: '20px', height: '20px', color: '#8b5cf6' }} />
              </div>
              <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                {messagesLeft === Infinity ? '∞' : messagesLeft}
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0 }}>
                {plan.charAt(0).toUpperCase() + plan.slice(1)} plan
              </p>
            </div>

            {/* Upcoming Lessons */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Next Lesson</span>
                <Clock style={{ width: '20px', height: '20px', color: '#22c55e' }} />
              </div>
              <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                {nextLesson ? getTimeUntilLesson() : 'None'}
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0 }}>
                {nextLesson ? `with ${nextLesson.teacher?.name || 'teacher'}` : 'Book a new lesson'}
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
                  <Calendar style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>No upcoming lessons</p>
                  <Link href="/student/teachers">
                    <button style={{
                      padding: '0.625rem 1.25rem',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'white',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
                      transition: 'all 0.2s'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      Find a Teacher
                    </button>
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {upcomingLessons.map(lesson => {
                    const now = new Date();
                    const lessonDateTime = new Date(lesson.date + ' ' + lesson.startTime);
                    const lessonEndTime = new Date(lessonDateTime.getTime() + (lesson.duration || 60) * 60 * 1000);
                    const diffMs = lessonDateTime - now;
                    const diffMins = Math.floor(diffMs / (1000 * 60));
                    const diffMinsFromEnd = Math.floor((lessonEndTime - now) / (1000 * 60));
                    // ✅ FIX: Video ONLY accessible for APPROVED lessons within time window
                    // Teacher must approve before video link is accessible!
                    const isApproved = lesson.status === 'approved';
                    const isWithinTimeWindow = diffMins >= -15 && diffMins <= 15 && diffMinsFromEnd >= -15;
                    const canJoin = lesson.meetingLink && isApproved && isWithinTimeWindow;
                    const startingSoon = diffMins <= 30 && diffMins > 0;

                    return (
                      <div key={lesson.id} style={{
                        padding: '1rem',
                        background: startingSoon ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : '#f8fafc',
                        borderRadius: '12px',
                        border: `2px solid ${startingSoon ? '#fcd34d' : '#e2e8f0'}`,
                        transition: 'all 0.2s'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: '#4338ca',
                              flexShrink: 0
                            }}>
                              {lesson.teacher?.name?.charAt(0) || 'T'}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>
                                {lesson.teacher?.name || 'Teacher'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {new Date(lesson.date + ' ' + lesson.startTime).toLocaleDateString('en-GB', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#64748b',
                            background: '#f1f5f9',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px'
                          }}>
                            {lesson.duration}min
                          </span>
                        </div>

                        {/* Countdown Timer */}
                        {diffMins > 0 && diffMins <= 120 && (
                          <div style={{
                            padding: '0.5rem',
                            background: 'rgba(255,255,255,0.5)',
                            borderRadius: '6px',
                            marginBottom: '0.5rem',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: startingSoon ? '#92400e' : '#64748b'
                          }}>
                            {diffMins < 60 ? `Starts in ${diffMins} minutes` : `Starts in ${Math.floor(diffMins / 60)}h ${diffMins % 60}m`}
                          </div>
                        )}

                        {/* Join Lesson Button */}
                        {canJoin && (
                          <a
                            href={lesson.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              padding: '0.625rem',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              border: 'none',
                              borderRadius: '6px',
                              textAlign: 'center',
                              color: 'white',
                              fontSize: '0.8125rem',
                              fontWeight: '600',
                              textDecoration: 'none',
                              transition: 'transform 0.2s',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                              animation: 'pulse 2s infinite'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            <Video style={{ width: '16px', height: '16px' }} />
                            Join Lesson Now
                          </a>
                        )}

                        <style jsx>{`
                          @keyframes pulse {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.9; }
                          }
                        `}</style>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Teachers */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>Your Teachers</h3>
                <Settings style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </div>

              {recentTeachers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <Settings style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                  <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>No teachers yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recentTeachers.map(teacher => (
                    <div
                      key={teacher.id}
                      style={{
                        padding: '0.875rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onClick={() => router.push(`/student/teacher/${teacher.id}`)}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: teacher.profilePhotoUrl
                            ? `url(${teacher.profilePhotoUrl}) center/cover`
                            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}>
                          {!teacher.profilePhotoUrl && (teacher.name || 'T')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {teacher.name}
                          </div>
                          {teacher.rating && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Star style={{ width: '12px', height: '12px', fill: '#fbbf24', color: '#fbbf24' }} />
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {teacher.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Link href="/student/teachers">
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
                      Browse All Teachers
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
                <MessageCircle style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </div>

              {conversations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <MessageCircle style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                  <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>No messages yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {conversations.map(conv => (
                    <div key={conv.id} style={{
                      padding: '0.875rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                      onClick={() => router.push('/student/chats')}
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
                          {(conv.otherUser?.name || 'T')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {conv.otherUser?.name || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                            Teacher
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Link href="/student/chats">
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
              <Link href="/student/teachers">
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
                  <Search style={{ width: '20px', height: '20px', color: '#3b82f6', marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>
                    Find Teachers
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    Browse and book
                  </div>
                </button>
              </Link>

              <Link href="/student/chats">
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
                  <MessageCircle style={{ width: '20px', height: '20px', color: '#3b82f6', marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>
                    Messages
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    Chat with teachers
                  </div>
                </button>
              </Link>

              <Link href="/student/subscription">
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
                  <Zap style={{ width: '20px', height: '20px', color: '#3b82f6', marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>
                    Subscription
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    Manage your plan
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
                  <Settings style={{ width: '20px', height: '20px', color: '#3b82f6', marginBottom: '0.5rem' }} />
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
