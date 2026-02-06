import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { useSubscriptionGuard } from '../../lib/subscriptionGuard';
import { BookOpen, Clock, Zap, CreditCard, Calendar, MessageSquare, TrendingUp, Eye, MessageCircle, Award, Gift, Info, Target } from 'lucide-react';
import SeoHead from '../../components/SeoHead';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
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

      const snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists()) {
        router.push('/login');
        return;
      }

      const userData = snap.data();
      if (userData.role !== 'student') {
        router.push('/teacher/dashboard');
        return;
      }

      if (!userData.emailVerified && user.emailVerified) {
        await updateDoc(doc(db, 'users', user.uid), { emailVerified: true });
        userData.emailVerified = true;
      }

      setData(userData);

      // Fetch upcoming lessons
      try {
        const lessonsQuery = query(
          collection(db, 'lessons'),
          where('studentId', '==', user.uid),
          where('status', '==', 'confirmed'),
          orderBy('date', 'asc'),
          limit(5)
        );
        const lessonsSnap = await getDocs(lessonsQuery);
        const lessons = lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUpcomingLessons(lessons);
      } catch (e) {
        console.error('Error fetching lessons:', e);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite'
        }} />
        <style jsx>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const plan = data.subscriptionPlan || 'free';
  const totalLessons = data.totalLessonsCompleted || 0;
  const totalHours = data.totalHoursLearned || 0;
  const currentStreak = data.learningStreak || 0;

  return (
    <>
      <SeoHead
        title="Student Dashboard"
        description="View your learning progress, upcoming lessons, and manage your BridgeLang account."
      />
      <div style={{ minHeight: '100vh', background: '#f8fafc' }} className="animate-fade-in">
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          {/* Page Header */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                  Dashboard
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0' }}>
                  Manage your learning journey
                </p>
              </div>
              <Link href="/student/teachers" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '0.625rem 1.25rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                  onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                >
                  + Book Lesson
                </button>
              </Link>
            </div>
          </div>

          {/* Plan Status Badge */}
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '6px',
                padding: '0.375rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Award style={{ width: '16px', height: '16px', color: '#15803d' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#15803d' }}>
                  Free Plan
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                <Eye style={{ width: '14px', height: '14px' }} />
                <span><strong>Unlimited</strong> views</span>
                <span>•</span>
                <MessageCircle style={{ width: '14px', height: '14px' }} />
                <span><strong>{data.messagesLeft || 5}</strong> messages</span>
              </div>
            </div>
            <Link href="/student/subscription" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '0.625rem 1.25rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(102,126,234,0.2)'
              }}
                onMouseEnter={(e) => { e.target.style.background = '#5a67d8'; e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 4px 8px rgba(102,126,234,0.3)'; }}
                onMouseLeave={(e) => { e.target.style.background = '#667eea'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 2px 4px rgba(102,126,234,0.2)'; }}
              >
                Upgrade Plan
              </button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 0.375rem 0', fontWeight: '500' }}>Lessons</p>
                <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', margin: '0' }}>{totalLessons}</p>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#eff6ff',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BookOpen style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
              </div>
            </div>

            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 0.375rem 0', fontWeight: '500' }}>Hours</p>
                <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', margin: '0' }}>{totalHours}</p>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#f0fdf4',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock style={{ width: '24px', height: '24px', color: '#10b981' }} />
              </div>
            </div>

            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 0.375rem 0', fontWeight: '500' }}>Streak</p>
                <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', margin: '0' }}>{currentStreak} <span style={{ fontSize: '1rem', color: '#64748b' }}>days</span></p>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#fef3c7',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp style={{ width: '24px', height: '24px', color: '#f59e0b' }} />
              </div>
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Plan Usage Card */}
              <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TrendingUp style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
                  </div>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Plan Usage
                  </h3>
                </div>

                <div style={{
                  background: '#fefce8',
                  border: '1px solid #fde047',
                  borderRadius: '8px',
                  padding: '0.875rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Info style={{ width: '16px', height: '16px', color: '#f59e0b', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.8125rem', color: '#713f12', margin: 0, fontWeight: '500' }}>
                    {plan === 'free' ? 'Free Plan - Unlimited features' :
                      plan === 'starter' ? 'Starter Plan - Enhanced features' :
                        plan === 'pro' ? 'Pro Plan - Advanced features' :
                          'VIP Plan - Premium features'}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <BookOpen style={{ width: '18px', height: '18px', color: '#64748b' }} />
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Lessons Taken</span>
                    </div>
                    <span style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0f172a' }}>{totalLessons}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <MessageCircle style={{ width: '18px', height: '18px', color: '#64748b' }} />
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Messages Left</span>
                    </div>
                    {/* Show unlimited if messagesAfterLesson exists with any teacher */}
                    {data.messagesAfterLesson && Object.keys(data.messagesAfterLesson).length > 0 ? (
                      <span style={{ fontSize: '1.125rem', fontWeight: '700', color: '#10b981' }}>Unlimited</span>
                    ) : plan === 'vip' ? (
                      <span style={{ fontSize: '1.125rem', fontWeight: '700', color: '#10b981' }}>Unlimited</span>
                    ) : (
                      <span style={{ fontSize: '1.125rem', fontWeight: '700', color: '#667eea' }}>
                        {(() => {
                          // Plan-based limits
                          const planLimits = { free: 5, starter: 10, pro: 20 };
                          const currentLimit = planLimits[plan] || 5;

                          // If messagesLeft is undefined/null, use plan default
                          // If it's defined (even if 0), show actual value
                          const displayValue = data.messagesLeft !== undefined && data.messagesLeft !== null
                            ? data.messagesLeft
                            : currentLimit;

                          return displayValue;
                        })()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Lesson Discounts Card */}
              <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: '#dbeafe',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Target style={{ width: '18px', height: '18px', color: '#3b82f6' }} />
                  </div>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Lesson Discounts
                  </h3>
                </div>

                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #93c5fd',
                  borderLeft: '3px solid #3b82f6',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  gap: '0.625rem'
                }}>
                  <Info style={{ width: '16px', height: '16px', color: '#3b82f6', flexShrink: 0, marginTop: '0.125rem' }} />
                  <p style={{ fontSize: '0.8125rem', color: '#1e3a8a', margin: 0, lineHeight: '1.6' }}>
                    <strong>Note:</strong> All eligible discounts and loyalty bonuses are applied automatically. No coupon codes needed!
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.875rem', fontWeight: '600' }}>
                    Discount Order:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.625rem', background: '#f8fafc', borderRadius: '6px' }}>
                      <div style={{ width: '20px', height: '20px', background: '#dbeafe', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.125rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#3b82f6' }}>1</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>First 6-Lesson Discount</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>Special intro rate</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.625rem', background: '#f8fafc', borderRadius: '6px' }}>
                      <div style={{ width: '20px', height: '20px', background: '#dbeafe', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.125rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#3b82f6' }}>2</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>Review Bonus</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>For leaving feedback</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.625rem', background: '#f8fafc', borderRadius: '6px' }}>
                      <div style={{ width: '20px', height: '20px', background: '#dbeafe', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.125rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#3b82f6' }}>3</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>Loyalty Bonus</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>Long-term students</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Lessons & Recent Activity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Upcoming Lessons */}
              <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.0625rem', fontWeight: '600', color: '#0f172a', margin: '0' }}>
                    Upcoming Lessons
                  </h2>
                  <Link href="/student/lessons" style={{ fontSize: '0.8125rem', color: '#3b82f6', fontWeight: '500', textDecoration: 'none' }}>
                    View all →
                  </Link>
                </div>
                {upcomingLessons.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1rem' }}>
                      No upcoming lessons
                    </p>
                    <Link href="/student/teachers" style={{ textDecoration: 'none' }}>
                      <button style={{
                        padding: '0.5rem 1rem',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: '500',
                        color: '#475569',
                        cursor: 'pointer'
                      }}>
                        Book a lesson
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {upcomingLessons.map(lesson => (
                      <div key={lesson.id} style={{
                        padding: '0.75rem',
                        border: '1px solid #f1f5f9',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                            {lesson.teacherName || 'Lesson'}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0' }}>
                            {lesson.date}
                          </p>
                        </div>
                        <Calendar style={{ width: '18px', height: '18px', color: '#94a3b8' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1.25rem'
              }}>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: '600', color: '#0f172a', margin: '0 0 1rem 0' }}>
                  Recent Activity
                </h2>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                    No recent activity
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1.25rem'
            }}>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: '600', color: '#0f172a', margin: '0 0 1rem 0' }}>
                Quick Actions
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                <Link href="/student/teachers" style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#475569',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <BookOpen style={{ width: '16px', height: '16px', color: '#64748b' }} />
                    Find Teachers
                  </button>
                </Link>

                <Link href="/student/lessons" style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#475569',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Calendar style={{ width: '16px', height: '16px', color: '#64748b' }} />
                    My Lessons
                  </button>
                </Link>

                <Link href="/student/chats" style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#475569',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <MessageSquare style={{ width: '16px', height: '16px', color: '#64748b' }} />
                    Messages
                  </button>
                </Link>

                <Link href="/student/subscription" style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#475569',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Zap style={{ width: '16px', height: '16px', color: '#64748b' }} />
                    Upgrade Plan
                  </button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
