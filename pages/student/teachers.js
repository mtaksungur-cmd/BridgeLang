import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Link from 'next/link';

export default function TeachersList() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    const fetchTeachers = async () => {
      const snap = await getDocs(collection(db, 'users'));
      const data = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.role === 'teacher' && user.status === 'approved');
      setTeachers(data);

      // her öğretmen için yorumları çek ve ortalamayı hesapla
      const ratingMap = {};
      for (let teacher of data) {
        const rSnap = await getDocs(
          query(collection(db, 'reviews'), where('teacherId', '==', teacher.id))
        );
        const reviews = rSnap.docs.map(d => d.data());
        const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        const avg = reviews.length > 0 ? total / reviews.length : 0;
        ratingMap[teacher.id] = {
          avgRating: avg,
          reviewCount: reviews.length,
        };
      }

      setRatings(ratingMap);
      setLoading(false);
    };

    fetchTeachers();
  }, []);

  if (loading) return <p>Loading teachers...</p>;

  return (
    <div style={{ padding: 40 }}>
      <h2>Browse Our Teachers</h2>
      {teachers.length === 0 ? (
        <p>No teachers available at the moment.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {teachers.map(t => (
            <div key={t.id} style={{ border: '1px solid #ccc', padding: 20, borderRadius: 10 }}>
              <Link href={`/student/teachers/${t.id}`}>
                <h3 style={{ color: 'blue', cursor: 'pointer' }}>{t.name}</h3>
              </Link>
              {t.profilePhotoUrl && (
                <img src={t.profilePhotoUrl} alt="Profile" width="100" style={{ borderRadius: '50%', marginTop: 10 }} />
              )}
              <p><strong>Languages:</strong> {t.languagesTaught}</p>
              <p><strong>Experience:</strong> {t.experienceYears} years</p>
              <p><strong>Price:</strong><br />
                30 min: £{t.pricing30}<br />
                45 min: £{t.pricing45}<br />
                60 min: £{t.pricing60}
              </p>
              <p>
                <strong>Rating:</strong>{' '}
                {ratings[t.id]
                  ? `⭐ ${ratings[t.id].avgRating.toFixed(1)} (${ratings[t.id].reviewCount} reviews)`
                  : 'No ratings yet'}
              </p>
              {Array.isArray(t.badges) && t.badges.length > 0 && (
                <p><strong>Badges:</strong> {t.badges.join(', ')}</p>
              )}
              <Link href={`/student/book/${t.id}`}>
                <button style={{ marginTop: 10 }}>📅 Book Lesson</button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
