import { useEffect, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import StudentLayout from '../../components/StudentLayout';
import SubscriptionBanner from "../../components/SubscriptionBanner";
import { useRouter } from 'next/router';
import styles from "../../scss/TeachersList.module.scss";

export default function TeachersList() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchTeachers = async () => {
      const snap = await getDocs(collection(db, 'users'));
      const data = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.role === 'teacher' && user.status === 'approved');

      // Yorumlar
      const reviewSnap = await getDocs(collection(db, 'reviews'));
      const reviewMap = {};

      reviewSnap.docs.forEach(doc => {
        const d = doc.data();
        if (!reviewMap[d.teacherId]) reviewMap[d.teacherId] = [];
        reviewMap[d.teacherId].push(d.rating);
      });

      const dataWithRatings = data.map(teacher => {
        const ratings = reviewMap[teacher.id] || [];
        const avg =
          ratings.length > 0
            ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
            : null;
        const badges = teacher.badges || [];
        const latestBadge = badges.length > 0 ? badges[badges.length - 1] : null;

        return {
          ...teacher,
          avgRating: avg,
          reviewCount: ratings.length,
          latestBadge
        };
      });

      dataWithRatings.sort((a, b) => {
        // Önce yorum sayısına göre azalan
        if (b.reviewCount !== a.reviewCount) {
          return b.reviewCount - a.reviewCount;
        }

        // Eğer eşitse, ortalama puana göre azalan
        return (b.avgRating || 0) - (a.avgRating || 0);
      });

      setTeachers(dataWithRatings);
      setLoading(false);
    };

    const checkPlan = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const sSnap = await getDoc(doc(db, "users", user.uid));
      if (sSnap.exists()) {
        setActivePlan(sSnap.data().subscriptionPlan || "");
      }
    };

    fetchTeachers();
    checkPlan();
  }, []);

  if (loading) return <p>Loading teachers...</p>;

  const isLocked = !activePlan;

  return (
      <div>
      <SubscriptionBanner />
      <div className={styles.container}>
        <h2>Browse Our Teachers</h2>

        {isLocked && (
          <div className={styles.lockedMessage}>
            <b>You need a subscription to view teachers.</b>
            <br />
            <Link href="/student/subscription">
              <button className={styles.seePlansBtn}>See Plans</button>
            </Link>
          </div>
        )}

        <div className={styles.grid}>
          {teachers.map(t => (
            <div
              key={t.id}
              className={`${styles.card} ${isLocked ? styles.locked : ''}`}
              onClick={isLocked ? () => router.push("/student/subscription") : undefined}
            >
              <div className={styles.cardContent} style={{ pointerEvents: isLocked ? "none" : "auto" }}>
                <Link href={`/student/teachers/${t.id}`}>
                  <h3 className={styles.teacherName}>{t.name}</h3>
                </Link>

                {/* Rating */}
                {t.avgRating ? (
                  <p className={styles.rating}>
                    ⭐ {t.avgRating} <span className={styles.reviewCount}>({t.reviewCount})</span>
                  </p>
                ) : (
                  <p className={styles.rating}>⭐ No reviews yet</p>
                )}

                {t.latestBadge && (
                  <p className={styles.badge}>
                    {t.latestBadge}
                  </p>
                )}

                {t.profilePhotoUrl && (
                  <img
                    src={t.profilePhotoUrl}
                    alt="Profile"
                    className={styles.profileImg}
                  />
                )}
                <p><strong>Languages:</strong> {t.languagesTaught}</p>
                <p><strong>Experience:</strong> {t.experienceYears} years</p>
                <p><strong>Price:</strong><br />
                  30 min: £{t.pricing30}<br />
                  45 min: £{t.pricing45}<br />
                  60 min: £{t.pricing60}
                </p>
                {!isLocked && (
                  <button
                    className={styles.reportBtn}
                    onClick={() => router.push(`/student/report?target=${t.id}`)}
                  >
                    🛑 Report
                  </button>
                )}
              </div>
              {isLocked && (
                <div className={styles.overlay}>
                  <span>Subscription required</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      </div>
  );
}
