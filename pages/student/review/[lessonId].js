import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { isInappropriate } from '../../../lib/messageFilter';
import styles from '../../../scss/ReviewLesson.module.scss';

export default function ReviewLesson() {
  const router = useRouter();
  const { lessonId } = router.query;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [lesson, setLesson] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hovered, setHovered] = useState(0);

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

        const teacherSnap = await getDoc(doc(db, 'users', data.teacherId));
        if (teacherSnap.exists()) {
          setTeacher(teacherSnap.data());
        }
      });
    };

    checkAuthAndLoad();
  }, [lessonId]);

  const handleSubmit = async () => {
    if (isInappropriate(comment)) {
      alert('Your comment contains inappropriate or forbidden content.');
      return;
    }

    setSubmitting(true);

    const res = await fetch(`/api/review/${lessonId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment }),
    });

    if (res.ok) {
      await fetch('/api/apply-review-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: lesson.studentId }),
      });
      alert('Thanks for your feedback!');
      router.push('/student/dashboard');
    } else {
      alert('Failed to submit review.');
    }

    setSubmitting(false);
  };

  if (!lesson || !teacher) return <p>Loading...</p>;

  return (
    <div>
      <div className={styles.container}>
        <h2 className={styles.title}>Leave a Review for Your Lesson</h2>

        <div className={styles.teacherBox}>
          {teacher.profilePhotoUrl && (
            <Image
              src={teacher.profilePhotoUrl}
              alt="Teacher"
              className={styles.avatar}
              width={60}   // istediğin değeri yazabilirsin
              height={60}  // istediğin değeri yazabilirsin
            />
          )}
          <p><strong>{teacher.name}</strong></p>
        </div>

        <p className={styles.lessonDate}><strong>Date:</strong> {lesson.date}</p>

        <label className={styles.label}>Rating (1–5):</label>
        <div
          className={styles.stars}
          onMouseLeave={() => setHovered(0)} // dışarı çıkınca hover sıfırlanır
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`${styles.star} ${
                star <= (hovered || rating) ? styles.filled : ''
              }`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
            >
              ★
            </span>
          ))}
        </div>

        <label className={styles.label}>Comment:</label>
        <textarea
          rows="4"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className={styles.textarea}
        />

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={styles.button}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
}
