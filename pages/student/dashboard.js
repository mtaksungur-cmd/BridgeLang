'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { 
  ChevronRight, Clock, MessageSquare, User, BookOpen, 
  Lightbulb, Settings, LogOut, CheckCircle2, Calendar, Gift, Star
} from 'lucide-react';
import SeoHead from '../../components/SeoHead';
import styles from '../../scss/StudentDashboardPremium.module.scss';

import { PLAN_LIMITS, getPlanLabel } from '../../lib/planLimits';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [unreviewedLesson, setUnreviewedLesson] = useState(null);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }

    // Safety timeout — if data doesn't load in 10s, stop loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled || redirecting) return;
      if (!user) {
        clearTimeout(timeout); setRedirecting(true); router.replace('/login'); return;
      }

      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (cancelled || redirecting) return;
        if (!userSnap.exists()) { clearTimeout(timeout); setRedirecting(true); router.replace('/login'); return; }

        const userData = userSnap.data();

        // Admin check FIRST — never override admin role
        if (userData.role === 'admin') {
          clearTimeout(timeout);
          setRedirecting(true);
          router.replace('/admin/teachers');
          return;
        }

        // Detect teacher by role OR teacher-specific fields (handles role overwritten to 'student' by old bug)
        const isTeacher = userData.role === 'teacher' ||
          userData.approved !== undefined ||
          userData.pricing30 !== undefined ||
          userData.stripeOnboarded !== undefined ||
          userData.specialties !== undefined;

        if (isTeacher) {
          // Fix the role in Firestore if it was wrongly set
          if (userData.role !== 'teacher') {
            try {
              await updateDoc(doc(db, 'users', user.uid), { role: 'teacher' });
            } catch (e) { /* ignore */ }
          }
          clearTimeout(timeout);
          setRedirecting(true);
          router.replace('/teacher/dashboard');
          return;
        }

        // Extra safety: check pendingTeachers collection
        try {
          const pendingSnap = await getDoc(doc(db, 'pendingTeachers', user.uid));
          if (pendingSnap.exists()) {
            clearTimeout(timeout);
            setRedirecting(true);
            router.replace('/teacher/dashboard');
            return;
          }
        } catch (e) { /* ignore */ }
        // If none of the above matched, stay on student dashboard

        if (userData.status === 'pending_consent') {
          clearTimeout(timeout);
          setRedirecting(true);
          router.replace('/login');
          return;
        }

        // Fetch student's booked lessons
        let bookingsData = [];
        try {
          const bookingsQuery = query(
            collection(db, 'bookings'),
            where('studentId', '==', user.uid),
            where('status', 'in', ['confirmed', 'approved', 'pending', 'completed'])
          );
          const bookingsSnap = await getDocs(bookingsQuery);

          for (const bookingDoc of bookingsSnap.docs) {
            const booking = { id: bookingDoc.id, ...bookingDoc.data() };
            if (booking.teacherId) {
              try {
                const teacherSnap = await getDoc(doc(db, 'users', booking.teacherId));
                if (teacherSnap.exists()) {
                  booking.teacherName = teacherSnap.data().name || 'Unknown Tutor';
                }
              } catch (e) {
                booking.teacherName = 'Unknown Tutor';
              }
            }
            bookingsData.push(booking);
          }

          bookingsData.sort((a, b) => {
            const dateA = a.date || '';
            const dateB = b.date || '';
            return dateB.localeCompare(dateA);
          });
        } catch (bookingError) {
          console.error('Bookings fetch error:', bookingError);
        }

        // Find unreviewed approved/completed lessons for review discount banner
        const approvedLessons = bookingsData.filter(b => b.status === 'approved' || b.status === 'completed');
        if (approvedLessons.length > 0) {
          try {
            for (const lesson of approvedLessons) {
              const reviewSnap = await getDoc(doc(db, 'reviews', lesson.id));
              if (!reviewSnap.exists()) {
                setUnreviewedLesson(lesson);
                break;
              }
            }
          } catch (e) {
            console.error('Review check error:', e);
          }
        }

        setLessons(bookingsData);
        setData(userData);
        clearTimeout(timeout);
        setLoading(false);
      } catch (error) {
        console.error('Dashboard error:', error);
        clearTimeout(timeout);
        setLoading(false);
      }
    });
    return () => { cancelled = true; unsubscribe(); clearTimeout(timeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || redirecting) return <div style={{textAlign:'center', padding:'5rem'}}>Loading...</div>;
  if (!data) return null;

  const planKey = data.subscriptionPlan || 'free';
  const planLabel = getPlanLabel(planKey);
  const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.free;

  const profileViewsLeft = data.viewLimit ?? limits.viewLimit;
  const messagesLeft = data.messagesLeft ?? limits.messagesLeft;

  return (
    <>
      <SeoHead title="Student Dashboard" description="Your learning dashboard on BridgeLang" />

      <div className={styles.dashboardPage}>
        {/* Top Banner */}
        <div className={styles.topBanner}>
          {planLabel} Plan — 
          {planKey === 'free' ? ' No membership fees. Only pay for the lessons you take.' : ' Enjoy your premium learning benefits!'}
        </div>

        {/* Review Discount Banner */}
        {(() => {
          const lessonCoupons = Array.isArray(data.lessonCoupons) ? data.lessonCoupons : [];
          const activeReviewCoupon = lessonCoupons.find(
            c => c.type === 'lesson' && (c.source === 'review-bonus' || c.source === 'first-review') && c.active && !c.used
          );
          const discountByPlan = { free: 25, starter: 30, pro: 35, vip: 40 };
          const potentialDiscount = discountByPlan[planKey] || 0;

          if (activeReviewCoupon) {
            const pct = activeReviewCoupon.percent || activeReviewCoupon.discount || 0;
            return (
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac',
                borderRadius: '12px', padding: '1rem 1.5rem', margin: '0 1.5rem 0.5rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem'
              }}>
                <Gift size={22} color="#16a34a" />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: '700', color: '#15803d', fontSize: '0.9375rem' }}>
                    You have a {pct}% review discount ready for your 2nd lesson!
                  </span>
                  <span style={{ color: '#166534', fontSize: '0.8125rem', marginLeft: '0.5rem' }}>
                    It will be applied automatically at checkout. This discount is covered by the platform.
                  </span>
                </div>
              </div>
            );
          }

          if (unreviewedLesson && potentialDiscount > 0) {
            return (
              <div style={{
                background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fcd34d',
                borderRadius: '12px', padding: '1rem 1.5rem', margin: '0 1.5rem 0.5rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem'
              }}>
                <Star size={22} color="#d97706" />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: '700', color: '#92400e', fontSize: '0.9375rem' }}>
                    Review &amp; get {potentialDiscount}% off your 2nd lesson!
                  </span>
                  <span style={{ color: '#78350f', fontSize: '0.8125rem', marginLeft: '0.5rem' }}>
                    The discount is covered by the platform — your tutor still gets paid in full.
                  </span>
                </div>
                <Link href={`/student/review/${unreviewedLesson.id}`} style={{
                  padding: '0.5rem 1rem', background: '#f59e0b', color: 'white', borderRadius: '8px',
                  fontWeight: '600', fontSize: '0.8125rem', textDecoration: 'none', whiteSpace: 'nowrap'
                }}>
                  Write Review
                </Link>
              </div>
            );
          }

          return null;
        })()}

        {/* Welcome Section */}
        <div className={styles.welcomeSection}>
          <h1>✨ Welcome to BridgeLang!</h1>
          <p style={{color:'#64748b', fontSize:'1.125rem', marginBottom:'2rem'}}>Ready to get started? Book your first lesson today.</p>
          <Link href="/student/teachers" className={styles.ctaBtn}>
            Browse Tutors & Book Your First Lesson
          </Link>
        </div>

        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Student Dashboard</h2>

          <div className={styles.grid}>
            {/* Left Column */}
            <div>
              <div className={styles.card} style={{padding:'2rem'}}>
                <div className={styles.userProfile} style={{marginBottom:'2rem'}}>
                   <div style={{width:56, height:56, background:'#4a6fbd', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'700', fontSize:'1.25rem'}}>
                    {data.name?.charAt(0) || 'S'}
                  </div>
                  <div className={styles.info}>
                    <h3>{data.name}</h3>
                    <p>Goal: {data.learningGoals?.[0] || 'English Fluency'}</p>
                  </div>
                </div>

                <div className={styles.nextStepBox}>
                  <div className={styles.stepLabel}><Clock size={16}/> Next Step:</div>
                  <Link href="/student/teachers" className={styles.stepMain}>
                    <span>Book your First Lesson</span>
                    <ChevronRight size={20} color="#cbd5e1" />
                  </Link>
                  <button className={styles.browseBtn} onClick={() => router.push('/student/teachers')}>Browse Tutors</button>
                  <Link href="/account/settings" className={styles.manageLink}>Manage Account</Link>
                </div>
              </div>

              <div className={styles.availabilityReminder}>
                <div className={styles.header} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                    <Calendar size={20} color="#f59e0b" fill="#fef3c7" /> Availability Reminder
                  </div>
                  <button
                    onClick={async () => {
                      const user = auth.currentUser;
                      if (!user) return;
                      const newVal = !data.disableAvailabilityReminders;
                      try {
                        await updateDoc(doc(db, 'users', user.uid), { disableAvailabilityReminders: newVal });
                        setData(prev => ({ ...prev, disableAvailabilityReminders: newVal }));
                      } catch (e) { console.error('Toggle reminder error:', e); }
                    }}
                    style={{
                      padding:'0.25rem 0.75rem', borderRadius:'6px', fontSize:'0.75rem', fontWeight:'600',
                      border:'1px solid #e2e8f0', cursor:'pointer',
                      background: data.disableAvailabilityReminders ? '#f1f5f9' : '#fef3c7',
                      color: data.disableAvailabilityReminders ? '#64748b' : '#92400e'
                    }}
                  >
                    {data.disableAvailabilityReminders ? '🔕 Reminders Off' : '🔔 Reminders On'}
                  </button>
                </div>
                {!data.disableAvailabilityReminders && (
                  <>
                    <div className={styles.proTip}>
                      <Lightbulb size={18} className={styles.bulb} />
                      <div>
                        <strong>Pro tip:</strong> Check tutor availability to book a lesson soon.
                      </div>
                    </div>
                    <p className={styles.reminderText}>Tutors can fill up fast, so look for tutors with times available in the next few days.</p>
                    <Link href="/student/teachers" className={styles.link}>
                      Browse available tutors &gt;
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className={styles.card}>
                <div className={styles.planDetails}>
                  <h4>{planLabel} Plan Details</h4>
                  
                  <div className={styles.usageItem}>
                    <span className={styles.label}>Profile Views</span>
                    <span className={styles.value} style={{color:'#16a34a', fontWeight:'700'}}>Unlimited</span>
                  </div>
                  <div className={styles.infoAlert}>
                    All plans include unlimited tutor profile views.
                  </div>

                  <div className={styles.usageItem} style={{marginTop:'1.5rem'}}>
                    <span className={styles.label}>Pre-Lesson Messages</span>
                    <span className={styles.value}>
                      {planKey === 'vip' ? (
                        <span style={{color:'#16a34a', fontWeight:'700'}}>Unlimited</span>
                      ) : (
                        <>{messagesLeft} / {limits.messagesLeft}</>
                      )}
                    </span>
                  </div>
                  <div className={styles.infoAlert}>
                    {planKey === 'vip'
                      ? 'You have unlimited messages with all tutors.'
                      : `${limits.messagesLeft} messages before booking on the ${planLabel} Plan. Unlimited after your first lesson with each tutor.`
                    }
                  </div>

                  {planKey !== 'vip' && (
                    <div style={{
                      background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px',
                      padding: '0.625rem 0.875rem', marginTop: '0.75rem', fontSize: '0.8125rem', color: '#166534'
                    }}>
                      Unlimited messaging after your first lesson with each tutor.
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>

          {/* Lessons Section */}
          <div style={{marginTop:'2rem'}}>
            <div className={styles.card} style={{padding:'2rem'}}>
              <div style={{display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem'}}>
                <BookOpen size={24} color="#3b82f6" />
                <h3 style={{margin:0, fontSize:'1.25rem', fontWeight:'700', color:'#0f172a'}}>Your Lessons</h3>
                <span style={{marginLeft:'auto', fontSize:'0.875rem', color:'#64748b'}}>{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</span>
              </div>

              {lessons.length === 0 ? (
                <div style={{textAlign:'center', padding:'3rem 1rem', background:'#f8fafc', borderRadius:'12px', border:'2px dashed #e2e8f0'}}>
                  <BookOpen size={40} color="#cbd5e1" style={{marginBottom:'1rem'}} />
                  <p style={{fontSize:'1rem', fontWeight:'600', color:'#64748b', margin:'0 0 0.5rem'}}>No lessons booked yet</p>
                  <p style={{fontSize:'0.875rem', color:'#94a3b8', margin:'0 0 1.5rem'}}>Book your first lesson to get started!</p>
                  <Link href="/student/teachers" style={{
                    display:'inline-block', padding:'0.75rem 1.5rem', background:'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color:'white', borderRadius:'10px', fontWeight:'600', fontSize:'0.875rem', textDecoration:'none'
                  }}>
                    Browse Tutors
                  </Link>
                </div>
              ) : (
                <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                  {lessons.map((lesson) => {
                    const isPast = lesson.date < new Date().toISOString().split('T')[0];
                    const statusColors = {
                      confirmed: {bg:'#dcfce7', color:'#166534', label:'Confirmed'},
                      approved: {bg:'#dcfce7', color:'#166534', label:'Approved'},
                      pending: {bg:'#fef3c7', color:'#92400e', label:'Pending'},
                    };
                    const statusStyle = statusColors[lesson.status] || statusColors.pending;

                    return (
                      <div key={lesson.id} style={{
                        display:'flex', alignItems:'center', gap:'1.25rem', padding:'1.25rem 1.5rem',
                        background: isPast ? '#f8fafc' : 'white', borderRadius:'14px',
                        border: `2px solid ${isPast ? '#e2e8f0' : '#dbeafe'}`,
                        opacity: isPast ? 0.7 : 1
                      }}>
                        <div style={{
                          width:48, height:48, borderRadius:'12px', display:'flex', flexDirection:'column',
                          alignItems:'center', justifyContent:'center',
                          background:'linear-gradient(135deg, #eff6ff, #dbeafe)', border:'2px solid #bfdbfe'
                        }}>
                          <span style={{fontSize:'0.7rem', fontWeight:'700', color:'#3b82f6', lineHeight:1}}>
                            {lesson.date ? new Date(lesson.date + 'T00:00:00').toLocaleDateString('en-GB', {month:'short'}).toUpperCase() : ''}
                          </span>
                          <span style={{fontSize:'1.125rem', fontWeight:'800', color:'#1e40af', lineHeight:1.2}}>
                            {lesson.date ? new Date(lesson.date + 'T00:00:00').getDate() : ''}
                          </span>
                        </div>

                        <div style={{flex:1, minWidth:0}}>
                          <div style={{fontSize:'1rem', fontWeight:'700', color:'#0f172a', marginBottom:'0.25rem'}}>
                            {lesson.teacherName || 'Tutor'}
                          </div>
                          <div style={{fontSize:'0.8125rem', color:'#64748b', display:'flex', gap:'1rem', flexWrap:'wrap'}}>
                            <span><Clock size={13} style={{verticalAlign:'middle', marginRight:4}} />{lesson.startTime}{lesson.endTime ? ` - ${lesson.endTime}` : ''}</span>
                            <span>{lesson.duration} min</span>
                            {lesson.location && <span>{lesson.location}</span>}
                          </div>
                        </div>

                        <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
                          {lesson.amountPaid != null && (
                            <span style={{fontSize:'0.9375rem', fontWeight:'700', color:'#0f172a'}}>£{lesson.amountPaid.toFixed(2)}</span>
                          )}
                          <span style={{
                            padding:'0.25rem 0.75rem', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'700',
                            background: statusStyle.bg, color: statusStyle.color
                          }}>
                            {isPast ? 'Completed' : statusStyle.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
