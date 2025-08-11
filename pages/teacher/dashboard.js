import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '../../lib/firebase';
import {
  doc, getDoc, collection, query, where, getDocs, updateDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import TeacherLayout from '../../components/TeacherLayout';
import styles from '../../scss/TeacherDashboard.module.scss';

const BADGE_DEFS = [
  { key: '🆕 New Teacher', desc: 'Granted automatically during the first 30 days after registration.' },
  { key: '💼 Active Teacher', desc: 'Taught at least 8 approved lessons in the last 3 months.' },
  { key: '🌟 5-Star Teacher', desc: 'Average rating of 4.8 or higher in the last 20 lessons.' },
];

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push('/login');

      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return router.push('/login');

      const userData = snap.data();
      if (userData.role !== 'teacher') return router.push('/student/dashboard');
      if (!userData?.stripeOnboarded) return router.push('/teacher/stripe-connect');

      // --- Badges & stats ---
      const now = new Date();
      const createdAt = userData.createdAt?.toDate?.() || new Date(userData.createdAt);
      const diffDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      const cutoffActive = new Date();
      cutoffActive.setDate(now.getDate() - 90);

      const bookingsQ = query(
        collection(db, 'bookings'),
        where('teacherId', '==', user.uid),
        where('status', '==', 'approved')
      );
      const bookingsSnap = await getDocs(bookingsQ);
      const lessons = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const activeLessonCount = lessons.filter(b => {
        const d = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return d >= cutoffActive;
      }).length;

      const sortedByDate = lessons
        .map(b => ({ ...b, d: b.createdAt?.toDate?.() || new Date(b.createdAt) }))
        .sort((a, b) => b.d - a.d);
      const recent20 = sortedByDate.slice(0, 20);

      const reviewQ = query(collection(db, 'reviews'), where('teacherId', '==', user.uid));
      const reviewSnap = await getDocs(reviewQ);
      const reviews = reviewSnap.docs.map(d => d.data());

      const recent20Ids = recent20.map(l => l.id);
      const recent20Reviews = reviews.filter(r => recent20Ids.includes(r.lessonId));
      const recent20Avg = recent20Reviews.length
        ? recent20Reviews.reduce((a, b) => a + (b.rating || 0), 0) / recent20Reviews.length
        : 0;

      const earnedBadges = [];
      if (diffDays <= 30) earnedBadges.push('🆕 New Teacher');
      if (activeLessonCount >= 8) earnedBadges.push('💼 Active Teacher');
      if (recent20Avg >= 4.8 && recent20.length >= 20) earnedBadges.push('🌟 5-Star Teacher');

      const studentIds = [...new Set(lessons.map(b => b.studentId))];
      const repeatStudentIds = studentIds.filter(id =>
        lessons.filter(b => b.studentId === id).length > 1
      );
      const repeatRate = studentIds.length ? repeatStudentIds.length / studentIds.length : 0;

      const avgRating = reviews.length
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

      const totalEarnings = typeof userData.totalEarnings === 'number' ? userData.totalEarnings : 0;

      await updateDoc(ref, {
        badges: earnedBadges,
        totalLessons: lessons.length,
        repeatRate,
        avgRating,
        totalEarnings,
      });

      setData({
        ...userData,
        uid: user.uid,
        totalLessons: lessons.length,
        repeatRate,
        avgRating,
        totalEarnings,
        badges: earnedBadges,
      });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !data?.uid) return;
    setUploading(true); setMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await res.json();
      if (!result.url) throw new Error('Upload failed');
      await updateDoc(doc(db, 'users', data.uid), { profilePhotoUrl: result.url });
      setData(prev => ({ ...prev, profilePhotoUrl: result.url }));
      setMsg('✅ Profile photo updated!');
    } catch {
      setMsg('❌ Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <p className={styles.loading}>Loading…</p>;
  if (!data) return null;

  const topBadge = (data.badges && data.badges.length)
    ? data.badges[data.badges.length - 1]
    : null;

  const detailedBadgeList = BADGE_DEFS.map(b => ({
    ...b,
    earned: (data.badges || []).includes(b.key),
  }));

  return (
    <TeacherLayout>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <h2>👨‍🏫 Teacher Dashboard</h2>
          {topBadge && (
            <div className={styles.topBadge}>
              <strong>Your Top Badge: {topBadge}</strong>
              <div className={styles.topBadge__desc}>
                {BADGE_DEFS.find(b => b.key === topBadge)?.desc || ''}
              </div>
            </div>
          )}
        </header>

        <section className={styles.profile}>
          <div className={styles.profile__left}>
            {data.profilePhotoUrl && (
              <img className={styles.profile__avatar} src={data.profilePhotoUrl} alt="Profile" />
            )}
            <label className={styles.profile__uploadLabel}>
              <span>Change Profile Photo</span>
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
            </label>
            {uploading && <p className={styles.info}>Uploading…</p>}
            {msg && (
              <p className={msg.startsWith('✅') ? styles.ok : styles.err}>
                {msg}
              </p>
            )}
          </div>

          <div className={styles.profile__right}>
            <div className={styles.statGrid}>
              <div className={styles.stat}>
                <div className={styles.stat__label}>Name</div>
                <div className={styles.stat__value}>{data.name}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.stat__label}>Email</div>
                <div className={styles.stat__value}>{data.email}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.stat__label}>Total Earnings</div>
                <div className={styles.stat__value}>£{(data.totalEarnings || 0).toFixed(2)}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.stat__label}>Total Lessons</div>
                <div className={styles.stat__value}>{data.totalLessons}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.stat__label}>Average Rating</div>
                <div className={styles.stat__value}>
                  {data.avgRating ? data.avgRating.toFixed(1) : '0.0'} ⭐
                </div>
              </div>
              <div className={styles.stat}>
                <div className={styles.stat__label}>Repeat Rate</div>
                <div className={styles.stat__value}>{Math.round((data.repeatRate || 0) * 100)}%</div>
              </div>
            </div>

            <button
              className={styles.btnPrimary}
              onClick={() => router.push('/teacher/calendar')}
            >
              🗓 Go to Calendar
            </button>
          </div>
        </section>

        <section className={styles.badges}>
          <h3>Your Badges & Progress</h3>
          <ul className={styles.badges__list}>
            {detailedBadgeList.map(b => (
              <li
                key={b.key}
                className={`${styles.badges__item} ${b.earned ? styles['badges__item--on'] : ''}`}
              >
                <span className={styles.badges__name}>{b.key}</span>
                <span className={styles.badges__sep}>—</span>
                <span className={styles.badges__desc}>{b.desc}</span>
                <span className={styles.badges__state}>
                  ({b.earned ? 'Achieved' : 'Not yet'})
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </TeacherLayout>
  );
}
