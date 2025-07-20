import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import StudentLayout from '../../../components/StudentLayout';

const badgeDescriptions = {
  '🆕 New Teacher': '🆕 New Teacher – Granted automatically during the first 30 days after registration.',
  '💼 Active Teacher': '💼 Active Teacher – Taught at least 8 approved lessons in the last 3 months.',
  '🌟 5-Star Teacher': '🌟 5-Star Teacher – Average rating of 4.8 or higher in the last 20 lessons.'
};

export default function TeacherProfilePage() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (!id) return;

    const fetchTeacher = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', id));
        if (snap.exists()) {
          setTeacher(snap.data());
        }
      } catch (error) {
        console.error('Failed to load teacher:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchReviews = async () => {
      const q = query(collection(db, 'reviews'), where('teacherId', '==', id));
      const snap = await getDocs(q);
      setReviews(snap.docs.map(doc => doc.data()));
    };

    fetchReviews();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!teacher) return <p>Teacher not found.</p>;

  // Profilde tüm rozetleri ve açıklamalarını göster
  return (
    <StudentLayout>
    <div style={{ padding: 40 }}>
      <h2>{teacher.name}</h2>
      {teacher.profilePhotoUrl && (
        <img src={teacher.profilePhotoUrl} alt="Profile" width="150" style={{ borderRadius: 10, marginBottom: 20 }} />
      )}
      <p><strong>Bio:</strong> {teacher.bio || 'No bio provided.'}</p>
      <p><strong>Languages Taught:</strong> {teacher.languagesTaught}</p>
      <p><strong>Languages Spoken:</strong> {teacher.languagesSpoken}</p>
      <p><strong>Education Level:</strong> {teacher.educationLevel}</p>
      <p><strong>Experience:</strong> {teacher.experienceYears} years</p>
      <p><strong>Lesson Pricing:</strong><br />
        30 min: £{teacher.pricing30}<br />
        45 min: £{teacher.pricing45}<br />
        60 min: £{teacher.pricing60}
      </p>
      {teacher.avgRating && (
        <p><strong>Rating:</strong> ⭐ {teacher.avgRating.toFixed(1)} ({teacher.reviewCount || 0} reviews)</p>
      )}

      {/* Rozetler ve açıklamaları */}
      <div style={{ marginTop: 20 }}>
        <h3>🎖 Badges</h3>
        {Array.isArray(teacher.badges) && teacher.badges.length > 0 ? (
          <ul>
            {teacher.badges.map((badge, index) => (
              <li key={index}>{badgeDescriptions[badge] || badge}</li>
            ))}
          </ul>
        ) : (
          <p>No badges earned yet.</p>
        )}
      </div>

      <div style={{ marginTop: 30 }}>
        <h3>Weekly Availability</h3>
        {teacher.availability && Object.keys(teacher.availability).length > 0 ? (
          ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
            const slots = teacher.availability[day];
            return (
              <p key={day}>
                <strong>{day}:</strong>{' '}
                {Array.isArray(slots) && slots.length > 0
                  ? slots.map((s) => `${s.start}–${s.end}`).join(', ')
                  : 'No availability'}
              </p>
            );
          })
        ) : (
          <p>No availability set.</p>
        )}
      </div>

      <div style={{ marginTop: 40 }}>
        <h3>Student Reviews</h3>
        {reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          <ul>
            {reviews.map((r, i) => (
              <li key={i} style={{ marginBottom: 15 }}>
                <strong>⭐ {r.rating}</strong><br />
                <span>{r.comment}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
    </StudentLayout>
  );
}
