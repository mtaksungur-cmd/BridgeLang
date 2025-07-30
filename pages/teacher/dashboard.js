import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import TeacherLayout from '../../components/TeacherLayout';

const BADGE_DEFS = [
  {
    key: '🆕 New Teacher',
    desc: 'Granted automatically during the first 30 days after registration.'
  },
  {
    key: '💼 Active Teacher',
    desc: 'Taught at least 8 approved lessons in the last 3 months.'
  },
  {
    key: '🌟 5-Star Teacher',
    desc: 'Average rating of 4.8 or higher in the last 20 lessons.'
  }
];

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [badges, setBadges] = useState([]);
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

      // BADGE LOGIC
      const now = new Date();
      const createdAt = userData.createdAt?.toDate?.() || new Date(userData.createdAt) || new Date();
      const diffDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      const cutoffActive = new Date();
      cutoffActive.setDate(now.getDate() - 90);

      // Onaylı dersler
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('teacherId', '==', user.uid),
        where('status', '==', 'approved')
      );
      const bookingsSnap = await getDocs(bookingsQuery);
      const lessons = bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Son 90 günde onaylı ders
      const activeLessonCount = lessons.filter(b => {
        const d = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return d >= cutoffActive;
      }).length;

      // Son 20 ders için ortalama puan
      const sortedByDate = lessons
        .map(b => ({ ...b, d: b.createdAt?.toDate?.() || new Date(b.createdAt) }))
        .sort((a, b) => b.d - a.d);
      const recent20 = sortedByDate.slice(0, 20);

      // Yorumlar (reviews)
      const reviewQuery = query(
        collection(db, 'reviews'),
        where('teacherId', '==', user.uid)
      );
      const reviewSnap = await getDocs(reviewQuery);
      const reviews = reviewSnap.docs.map(doc => doc.data());

      const recent20LessonIds = recent20.map(l => l.id);
      const recent20Reviews = reviews.filter(r => recent20LessonIds.includes(r.lessonId));
      const recent20Avg = recent20Reviews.length
        ? recent20Reviews.reduce((a, b) => a + (b.rating || 0), 0) / recent20Reviews.length
        : 0;

      // Rozetler
      const earnedBadges = [];
      if (diffDays <= 30) earnedBadges.push('🆕 New Teacher');
      if (activeLessonCount >= 8) earnedBadges.push('💼 Active Teacher');
      if (recent20Avg >= 4.8 && recent20.length >= 20) earnedBadges.push('🌟 5-Star Teacher');
      setBadges(earnedBadges);

      // Tekrarlı öğrenci oranı (repeat rate)
      const studentIds = [...new Set(lessons.map(b => b.studentId))];
      const repeatStudentIds = studentIds.filter(id =>
        lessons.filter(b => b.studentId === id).length > 1
      );
      const repeatRate = studentIds.length > 0 ? repeatStudentIds.length / studentIds.length : 0;

      // Ortalama puan ve toplam kazanç
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

      // Firestore'daki totalEarnings (backend update ediyor, frontend sadece gösterir)
      const totalEarnings = typeof userData.totalEarnings === "number" ? userData.totalEarnings : 0;

      // Güncelleme
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
  }, []);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setMsg('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await res.json();
      if (!result.url) throw new Error('Upload failed');
      await updateDoc(doc(db, 'users', data.uid), { profilePhotoUrl: result.url });
      setData(prev => ({ ...prev, profilePhotoUrl: result.url }));
      setMsg('✅ Profile photo updated!');
    } catch (err) {
      setMsg('❌ Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  // *** ROZET & KAZANÇ GÖSTERİMİ ***
  // Top Badge -> badge array'in SON elemanı varsa onu göster
  const topBadge = (data.badges && data.badges.length)
    ? data.badges[data.badges.length - 1]
    : null;

  const detailedBadgeList = BADGE_DEFS.map(b => ({
    ...b,
    earned: (data.badges || []).includes(b.key)
  }));

  return (
    <TeacherLayout>
      <div style={{ padding: 40 }}>
        <h2>👨‍🏫 Teacher Dashboard</h2>
        {topBadge && (
          <div style={{
            marginBottom: 12,
            fontSize: 18,
            background: "#e6f7e7",
            borderRadius: 12,
            padding: 12
          }}>
            <b>Your Top Badge: {topBadge}</b>
            <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
              {BADGE_DEFS.find(b => b.key === topBadge)?.desc || ''}
            </div>
          </div>
        )}

        {data.profilePhotoUrl && (
          <div style={{ marginBottom: 20 }}>
            <img src={data.profilePhotoUrl} alt="Profile" width="120" style={{ borderRadius: '50%' }} />
          </div>
        )}
        <label>Change Profile Photo:</label><br />
        <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploading} /><br />
        {uploading && <p>Uploading...</p>}
        {msg && <p style={{ color: msg.startsWith('✅') ? 'green' : 'red' }}>{msg}</p>}

        <hr />

        <p><strong>Name:</strong> {data.name}</p>
        <p><strong>Email:</strong> {data.email}</p>
        <p><strong>Total Earnings:</strong> £{data.totalEarnings?.toFixed(2) || "0.00"}</p>
        <p><strong>Total Lessons Given:</strong> {data.totalLessons}</p>
        <p><strong>Average Rating:</strong> {data.avgRating ? data.avgRating.toFixed(1) : "0.0"} ⭐</p>
        <p><strong>Student Repeat Rate:</strong> {Math.round((data.repeatRate || 0) * 100)}%</p>

        <hr />
        <h3>Your Badges & Progress</h3>
        <ul>
          {detailedBadgeList.map(b => (
            <li key={b.key} style={{ color: b.earned ? '#1a8917' : '#aaa', marginBottom: 6 }}>
              <span style={{ fontWeight: b.earned ? 600 : 400 }}>{b.key}</span>
              {' - '}
              <span>{b.desc}</span>
              <span style={{ marginLeft: 10, fontStyle: 'italic', fontSize: 13 }}>
                ({b.earned ? 'Achieved' : 'Not yet'})
              </span>
            </li>
          ))}
        </ul>

        <hr />
        <p><strong>📅 Click to edit your calendar:</strong></p>
        <button onClick={() => router.push('/teacher/calendar')}>
          🗓 Go to Calendar
        </button>
      </div>
    </TeacherLayout>
  );
}
