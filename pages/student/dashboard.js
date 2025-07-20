import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import StudentLayout from '../../components/StudentLayout';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [teachers, setTeachers] = useState({});
  const router = useRouter();

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

      setData({ ...userData, uid: user.uid });
      setLoading(false);
      fetchBookings(user.uid);
    });

    return () => unsubscribe();
  }, []);

  const fetchBookings = async (uid) => {
    const q = query(collection(db, 'bookings'), where('studentId', '==', uid));
    const snap = await getDocs(q);
    const bookingsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBookings(bookingsList);

    // Öğretmen bilgilerini tek seferde topla
    const teacherIds = [...new Set(bookingsList.map(b => b.teacherId))];
    const teacherMap = {};
    for (let id of teacherIds) {
      const tSnap = await getDoc(doc(db, 'users', id));
      if (tSnap.exists()) teacherMap[id] = tSnap.data();
    }
    setTeachers(teacherMap);

    // Yorum yapılmış dersleri getir
    const rSnap = await getDocs(collection(db, 'reviews'));
    const rMap = {};
    rSnap.docs.forEach(d => rMap[d.id] = true);
    setReviews(rMap);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();

      await updateDoc(doc(db, 'users', data.uid), {
        profilePhotoUrl: result.url,
      });

      setData((prev) => ({ ...prev, profilePhotoUrl: result.url }));
    } catch (err) {
      alert('Failed to upload photo.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <StudentLayout>
    <div style={{ padding: 40, maxWidth: 600, margin: 'auto' }}>
      <div style={{ textAlign: 'center' }}>
        {data.profilePhotoUrl ? (
          <img
            src={data.profilePhotoUrl}
            alt="Profile"
            style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <p style={{ fontStyle: 'italic' }}>No profile photo uploaded</p>
        )}
        <br />
        <label style={{ fontSize: 14 }}>
          {uploading ? 'Uploading...' : 'Change Photo:'}
          <input
            type="file"
            accept="image/*"
            style={{ display: 'block', margin: '10px auto' }}
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      <h2>🎓 Student Dashboard</h2>
      <p><strong>Full Name:</strong> {data.name}</p>
      <p><strong>Email:</strong> {data.email} {auth.currentUser?.emailVerified ? '✅' : '❌'}</p>
      <p><strong>City/Postcode:</strong> {data.city || '-'}</p>
      <p><strong>Timezone:</strong> {data.timezone || '-'}</p>
      <p><strong>Phone:</strong> {data.phone || '-'}</p>
      <p><strong>Level:</strong> {data.level || '-'}</p>
      <p><strong>Bio:</strong><br />{data.intro || '-'}</p>
      <p><strong>Goals:</strong>
        <ul>
          {data.goals && data.goals.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ul>
      </p>
      <p><strong>Subscription:</strong> {data.subscriptionPlan || 'Starter'}</p>

      <div style={{ marginTop: 30 }}>
        <h3>Your Reservations</h3>
        {bookings.length === 0 ? (
          <p>No reservations yet.</p>
        ) : (
          bookings.map((b, i) => {
            const reviewed = reviews[b.id];
            const teacher = teachers[b.teacherId] || {};

            return (
              <div key={i} style={{ borderBottom: '1px solid #ccc', marginBottom: 15, paddingBottom: 10 }}>
                {teacher.profilePhotoUrl && (
                  <img src={teacher.profilePhotoUrl} alt="Teacher" width={60} height={60}
                    style={{ borderRadius: '50%', objectFit: 'cover', marginBottom: 8 }}
                  />
                )}
                <p><strong>Teacher:</strong> {teacher.name || 'N/A'}</p>
                <p><strong>Date:</strong> {b.date}</p>
                <p><strong>Time:</strong> {b.startTime} – {b.endTime}</p>
                <p><strong>Duration:</strong> {b.duration} minutes</p>
                <p><strong>Location:</strong> {b.location}</p>
                <p><strong>Status:</strong> {b.status}</p>
                {b.meetingLink && (
                  <p><a href={b.meetingLink} target="_blank" rel="noopener noreferrer">Join Online Lesson</a></p>
                )}
                {b.status === 'approved' && !reviewed && (
                  <p>
                    <a href={`/student/review/${b.id}`}>
                      <button>✍️ Leave a Review</button>
                    </a>
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
    </StudentLayout>
  );
}
