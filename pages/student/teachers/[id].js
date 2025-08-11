import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '../../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import StudentLayout from '../../../components/StudentLayout';
import styles from "../../../scss/TeacherProfile.module.scss";

const badgeDescriptions = {
  '🆕 New Teacher': '🆕 New Teacher – Granted automatically during the first 30 days after registration.',
  '💼 Active Teacher': '💼 Active Teacher – Taught at least 8 approved lessons in the last 3 months.',
  '🌟 5-Star Teacher': '🌟 5-Star Teacher – Average rating of 4.8 or higher in the last 20 lessons.'
};

export default function TeacherProfilePage() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [chatsLeft, setChatsLeft] = useState(null);
  const [viewLimit, setViewLimit] = useState(null);
  const [reviewUsers, setReviewUsers] = useState({});
  const router = useRouter();
  const { id } = router.query;

  const fetchUserLimits = async () => {
    const user = auth.currentUser;
    if (user) {
      const sSnap = await getDoc(doc(db, 'users', user.uid));
      if (sSnap.exists()) {
        setChatsLeft(sSnap.data().messagesLeft ?? 0);
        setViewLimit(sSnap.data().viewLimit ?? null);
      }
    }
  };

  useEffect(() => {
    if (reviews.length === 0) return;
    const fetchReviewUsers = async () => {
      const userMap = {};
      for (let r of reviews) {
        if (r.studentId && !userMap[r.studentId]) {
          const snap = await getDoc(doc(db, 'users', r.studentId));
          if (snap.exists()) {
            userMap[r.studentId] = snap.data();
          }
        }
      }
      setReviewUsers(userMap);
    };
    fetchReviewUsers();
  }, [reviews]);

  // Görüntüleme hakkını azalt
  useEffect(() => {
    if (!id) return;
    const user = auth.currentUser;
    if (!user) return;
    const key = `viewed_${user.uid}_${id}`;
    if (localStorage.getItem(key)) return;
    fetch('/api/decrement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.uid, type: "view" }),
    })
      .then(res => res.json())
      .then(data => {
        setViewLimit(data.viewLimit ?? null);
        localStorage.setItem(key, "1");
      });
  }, [id]);

  // Öğretmen bilgisi
  useEffect(() => {
    if (!id) return;
    const fetchTeacher = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', id));
        if (snap.exists()) setTeacher(snap.data());
      } catch (error) {
        console.error('Failed to load teacher:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
    fetchUserLimits();
  }, [id]);

  // Yorumlar
  useEffect(() => {
    if (!id) return;
    const fetchReviews = async () => {
      const q = query(collection(db, 'reviews'), where('teacherId', '==', id));
      const snap = await getDocs(q);
      setReviews(snap.docs.map(doc => doc.data()));
    };
    fetchReviews();
  }, [id]);

  const handleBookLesson = () => {
    router.push(`/student/book/${id}`);
  };

  const handleStartChat = async () => {
    if (chatsLeft === 0) {
      alert("You have no chat rights left for this month.");
      return;
    }
    router.push(`/student/chats/${auth.currentUser.uid}_${id}`);
  };

  if (loading) return <p>Loading...</p>;
  if (!teacher) return <p>Teacher not found.</p>;

  return (
    <StudentLayout>
      <div className={styles.container}>
        {/* ÜST PANEL */}
        <div className={styles.topSection}>
          {/* Sol panel */}
          <div className={styles.leftPanel}>
            {teacher.profilePhotoUrl && (
              <img src={teacher.profilePhotoUrl} alt="Profile" className={styles.profileImg} />
            )}
            <h2 className={styles.name}>{teacher.name}</h2>
            {teacher.avgRating && (
              <p className={styles.rating}>
                ⭐ {teacher.avgRating.toFixed(1)} ({teacher.reviewCount || 0} reviews)
              </p>
            )}
            <div className={styles.badges}>
              {Array.isArray(teacher.badges) && teacher.badges.length > 0 ? (
                (() => {
                  const lastBadge = teacher.badges[teacher.badges.length - 1];
                  return (
                    <span className={styles.badge} title={badgeDescriptions[lastBadge]}>
                      {lastBadge}
                    </span>
                  );
                })()
              ) : (
                <span className={styles.noBadge}>No badges yet</span>
              )}
            </div>
          </div>

          {/* orta panel */}
          <div className={styles.centerPanel}>
            <p><strong>Bio:</strong> {teacher.bio || 'No bio provided.'}</p>
            <p><strong>Languages Taught:</strong> {teacher.languagesTaught}</p>
            <p><strong>Languages Spoken:</strong> {teacher.languagesSpoken}</p>
            <p><strong>Education Level:</strong> {teacher.educationLevel}</p>
            <p><strong>Experience:</strong> {teacher.experienceYears} years</p>
            <div className={styles.pricing}>
              <strong>Lesson Pricing:</strong>
              <table>
                <tbody>
                  <tr><td>30 min</td><td>£{teacher.pricing30}</td></tr>
                  <tr><td>45 min</td><td>£{teacher.pricing45}</td></tr>
                  <tr><td>60 min</td><td>£{teacher.pricing60}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sağ panel */}
          <div className={styles.availabilityPanel}>
            <h4>Weekly Availability</h4>
            {teacher.availability && Object.keys(teacher.availability).length > 0 ? (
              <table className={styles.availabilityTable}>
                <tbody>
                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => {
                    const slots = teacher.availability[day];
                    return (
                      <tr key={day}>
                        <td className={styles.dayCell}><strong>{day}</strong></td>
                        <td>
                          {Array.isArray(slots) && slots.length > 0
                            ? slots.map(s => `${s.start}–${s.end}`).join(', ')
                            : 'No availability'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p>No availability set.</p>
            )}
          </div>
        </div>

            <div className={styles.actions}>
              <button
                onClick={handleBookLesson}
                className={styles.btnSecondary}
              >
                📅 Book Lesson
              </button>
              <button
                onClick={handleStartChat}
                disabled={chatsLeft === null || chatsLeft <= 0}
                className={styles.btnSecondary}
              >
                💬 Send Message ({chatsLeft ?? 0} left)
              </button>
              {viewLimit !== null && (
                <span className={styles.viewInfo}>
                  Views left: <b>{viewLimit}</b>
                </span>
              )}
            </div>
        {/* YORUMLAR */}
        <div className={styles.reviews}>
          <h3>Student Reviews</h3>
          {reviews.length === 0 ? (
            <p>No reviews yet.</p>
          ) : (
            <div className={styles.reviewList}>
              {reviews.map((r, i) => {
                const student = r.studentId ? reviewUsers[r.studentId] : null;
                return (
                  <div key={i} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      {student?.profilePhotoUrl && (
                        <img
                          src={student.profilePhotoUrl}
                          alt={student.name}
                          className={styles.reviewAvatar}
                        />
                      )}
                      <div>
                        <strong>{student?.name || 'Anonymous'}</strong>
                        <div>⭐ {r.rating}</div>
                      </div>
                    </div>
                    <p>{r.comment}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
