import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function ReviewLesson() {
  const router = useRouter();
  const { lessonId } = router.query;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [lesson, setLesson] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      onAuthStateChanged(auth, async (user) => {
        if (!user || !lessonId) return;

        const snap = await getDoc(doc(db, 'bookings', lessonId));
        if (!snap.exists()) {
          router.push('/student/lessons');
          return;
        }

        const data = snap.data();
        if (data.studentId !== user.uid || data.status !== 'approved') {
          alert('You are not allowed to review this lesson.');
          router.push('/student/lessons');
          return;
        }

        setLesson({ id: snap.id, ...data });

        // öğretmen verisini çek
        const teacherSnap = await getDoc(doc(db, 'users', data.teacherId));
        if (teacherSnap.exists()) {
          setTeacher(teacherSnap.data());
        }
      });
    };

    checkAuthAndLoad();
  }, [lessonId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    const res = await fetch(`/api/review/${lessonId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment }),
    });

    if (res.ok) {
      alert('Thanks for your feedback!');
      router.push('/student/lessons');
    } else {
      alert('Failed to submit review.');
    }

    setSubmitting(false);
  };

  if (!lesson || !teacher) return <p>Loading...</p>;

  return (
    <div style={{ padding: 40 }}>
      <h2>Leave a Review for Your Lesson</h2>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        {teacher.profilePhotoUrl && (
          <img
            src={teacher.profilePhotoUrl}
            alt="Teacher"
            style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', marginRight: 15 }}
          />
        )}
        <p><strong>{teacher.name}</strong></p>
      </div>

      <p><strong>Date:</strong> {lesson.date}</p>

      <label>Rating (1–5):</label><br />
      <input
        type="number"
        min="1"
        max="5"
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
      /><br /><br />

      <label>Comment:</label><br />
      <textarea
        rows="4"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{ width: '100%', maxWidth: 500 }}
      /><br /><br />

      <button onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  );
}
