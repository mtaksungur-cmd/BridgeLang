import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        router.push('/login');
        return;
      }

      const userData = snap.data();
      if (userData.role !== 'teacher') {
        router.push('/student/dashboard');
        return;
      }

      const createdAt = userData.createdAt ? new Date(userData.createdAt) : new Date();
      const totalLessons = userData.totalLessons || 0;
      const total5StarReviews = userData.total5StarReviews || 0;
      const diffDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      const newBadges = [];
      if (diffDays <= 30) newBadges.push('🆕 New Teacher');
      if (totalLessons >= 4) newBadges.push('🔥 Active Teacher');
      if (total5StarReviews >= 3) newBadges.push('⭐ 5-Star Rated');

      // Firestore'daki rozetleri güncelle
      await updateDoc(ref, { badges: newBadges });

      setData({ ...userData, uid: user.uid, badges: newBadges });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      if (!result.url) throw new Error('Upload failed');

      await updateDoc(doc(db, 'users', data.uid), {
        profilePhotoUrl: result.url
      });

      setData(prev => ({ ...prev, profilePhotoUrl: result.url }));
      setMsg('✅ Profile photo updated!');
    } catch (err) {
      console.error(err);
      setMsg('❌ Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  const totalEarnings = data.totalEarnings || 0;
  const totalLessons = data.totalLessons || 0;
  const avgRating = data.avgRating || 0;
  const repeatRate = data.repeatRate || 0;

  const monthlySummary = `This month you taught ${data.monthlyLessons || 0} lessons with ${data.monthlyStudents || 0} students. Great job! ${
    totalLessons >= 4 ? 'Your Active Teacher badge has been updated.' : ''
  } Don’t forget to ask students for reviews to boost your visibility.`;

  return (
    <div style={{ padding: 40 }}>
      <h2>👨‍🏫 Teacher Dashboard</h2>

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
      <p><strong>Expertise:</strong> {data.expertise || '-'}</p>
      <p><strong>Bio:</strong> {data.bio || '-'}</p>

      <hr />
      <p><strong>Total Earnings:</strong> £{totalEarnings}</p>
      <p><strong>Total Lessons Given:</strong> {totalLessons}</p>
      <p><strong>Average Rating:</strong> {avgRating.toFixed(1)} ⭐</p>
      <p><strong>Student Repeat Rate:</strong> {Math.round(repeatRate * 100)}%</p>

      <p><strong>Badges:</strong> {data.badges?.length > 0 ? data.badges.join(', ') : 'No badges yet'}</p>

      <hr />
      <p><strong>📬 Monthly Summary:</strong><br />{monthlySummary}</p>
    </div>
  );
}
