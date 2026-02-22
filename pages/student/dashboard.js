'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { 
  ChevronRight, Clock, MessageSquare, User, BookOpen, 
  Lightbulb, Settings, LogOut, CheckCircle2, Calendar 
} from 'lucide-react';
import SeoHead from '../../components/SeoHead';
import styles from '../../scss/StudentDashboardPremium.module.scss';

import { PLAN_LIMITS, getPlanLabel } from '../../lib/planLimits';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }

      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (!userSnap.exists()) { router.push('/login'); return; }

        const userData = userSnap.data();
        if (userData.role !== 'student') {
          router.push('/teacher/dashboard');
          return;
        }

        if (userData.status === 'pending_consent') {
          router.push('/login');
          return;
        }

        // Fetch student's booked lessons
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('studentId', '==', user.uid),
          where('status', 'in', ['confirmed', 'approved', 'pending'])
        );
        const bookingsSnap = await getDocs(bookingsQuery);
        const bookingsData = [];

        for (const bookingDoc of bookingsSnap.docs) {
          const booking = { id: bookingDoc.id, ...bookingDoc.data() };
          // Fetch teacher name
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

        // Sort by date descending (newest first)
        bookingsData.sort((a, b) => {
          const dateA = a.date || '';
          const dateB = b.date || '';
          return dateB.localeCompare(dateA);
        });

        setLessons(bookingsData);
        setData(userData);
        setLoading(false);
      } catch (error) {
        console.error('Dashboard error:', error);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) return <div style={{textAlign:'center', padding:'5rem'}}>Loading...</div>;
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
                <div className={styles.header}>
                   <Calendar size={20} color="#f59e0b" fill="#fef3c7" /> Availability Reminder
                </div>
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
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className={styles.card}>
                <div className={styles.planDetails}>
                  <h4>{planLabel} Plan Details</h4>
                  
                  <div className={styles.usageItem}>
                    <span className={styles.label}>Profile Views Left</span>
                    <span className={styles.value}>{profileViewsLeft >= 9999 ? 'Unlimited' : profileViewsLeft} &gt;</span>
                  </div>
                  <div className={styles.infoAlert}>
                    {planKey === 'vip' ? 'You have unlimited profile views.' : `You can view up to ${limits.viewLimit} tutor profiles on the ${planLabel} Plan.`}
                  </div>

                  <div className={styles.usageItem} style={{marginTop:'1.5rem'}}>
                    <span className={styles.label}>Messages Left</span>
                    <span className={styles.value}>{messagesLeft >= 9999 ? 'Unlimited' : messagesLeft} &gt;</span>
                  </div>
                  <div className={styles.infoAlert}>
                    {planKey === 'vip' ? 'You have unlimited messages.' : `You can message up to ${limits.messagesLeft} tutors on the ${planLabel} Plan.`}
                  </div>

                  <Link href="/student/subscription" className={styles.showDetails}>Show usage details &gt;</Link>
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
