import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import {
  doc, getDoc, updateDoc, collection, query, where, getDocs
} from 'firebase/firestore';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';
import SubscriptionBanner from '../../components/SubscriptionBanner';
import LoyaltyBadge from '../../components/LoyaltyBadge';
import { getLoyaltyInfo } from '../../lib/loyalty';
import { useSubscriptionGuard } from '../../lib/subscriptionGuard';
import styles from '../../scss/StudentDashboard.module.scss';
import { getStorage, ref, getDownloadURL } from "firebase/storage";

const storage = getStorage(undefined, "bridgelang-uk.firebasestorage.app");

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [teachers, setTeachers] = useState({});
  const [photoUrl, setPhotoUrl] = useState(null);
  const router = useRouter();

  const activeUntilMillis =
    data?.subscription?.activeUntil?._seconds
      ? data.subscription.activeUntil._seconds * 1000
      : (data?.subscription?.activeUntilMillis || null);
  useSubscriptionGuard({ plan: data?.subscriptionPlan, activeUntilMillis, graceDays: 0 });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      await user.reload();

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

      if (!userData.emailVerified && user.emailVerified) {
        await updateDoc(doc(db, 'users', user.uid), { emailVerified: true });
        userData.emailVerified = true;
      }

      setData({ ...userData, uid: user.uid });

      try {
        const info = await getLoyaltyInfo(user.uid);
        setLoyalty(info);
      } catch (e) {
        console.error('loyalty load error:', e);
        setLoyalty(null);
      }

      fetchBookings(user.uid);
      fetchReviews(user.uid);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadPhoto = async () => {
      if (data?.profilePhotoUrl) {
        try {
          const url = await getDownloadURL(ref(storage, data.profilePhotoUrl));
          setPhotoUrl(url);
        } catch (e) {
          console.error("downloadURL error:", e);
          setPhotoUrl(null);
        }
      }
    };
    loadPhoto();
  }, [data?.profilePhotoUrl]);

  const fetchBookings = async (uid) => {
    const q = query(collection(db, 'bookings'), where('studentId', '==', uid));
    const snap = await getDocs(q);
    const bookingsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBookings(bookingsList);

    const teacherIds = [...new Set(bookingsList.map(b => b.teacherId))];
    const teacherMap = {};
    for (let id of teacherIds) {
      const tSnap = await getDoc(doc(db, 'users', id));
      if (tSnap.exists()) teacherMap[id] = tSnap.data();
    }
    setTeachers(teacherMap);
  };

  const fetchReviews = async (uid) => {
    const q = query(collection(db, 'reviews'), where('studentId', '==', uid));
    const snap = await getDocs(q);
    const rMap = {};
    snap.docs.forEach(d => rMap[d.id] = true);
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

      if (!result.url) throw new Error("Upload failed: no URL returned");

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

  let sortedBookings = [...bookings];
  const getTime = (b) => new Date(b.date + ' ' + (b.startTime || '00:00')).getTime();
  sortedBookings.sort((a, b) => {
    const aReviewed = reviews[a.id];
    const bReviewed = reviews[b.id];
    if (aReviewed && !bReviewed) return 1;
    if (!aReviewed && bReviewed) return -1;
    return getTime(b) - getTime(a);
  });

  return (
    <div className={styles.dashboard}>
      <SubscriptionBanner />
      {loyalty && (
        <LoyaltyBadge
          plan={loyalty.plan}
          loyaltyMonths={loyalty.loyaltyMonths}
          loyaltyBonusCount={loyalty.loyaltyBonusCount}
          discountEligible={loyalty.discountEligible}
          promoCode={loyalty.promoCode}
          lessonCoupons={data.lessonCoupons || []}
          subscriptionCoupons={data.subscriptionCoupons || []}
          lessonsTaken={data.lessonsTaken || 0}
        />
      )}

      <h2>🎓 Student Dashboard</h2>

      {/* PROFIL ALANI */}
      <div className={styles['dashboard-row']}>
        <div className={styles['dashboard-profile']}>
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt="Profile"
              className={styles['dashboard-profile-img']}
              width={140}
              height={140}
            />
          ) : (
            <p style={{ fontStyle: "italic" }}>No profile photo uploaded</p>
          )}
          <label className={styles['dashboard-profile-label']}>
            {uploading ? 'Uploading...' : 'Change Photo:'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
          <p><strong>Full Name:</strong> {data.name}</p>
          <p><strong>Email:</strong> {data.email} {auth.currentUser?.emailVerified ? '✅' : '❌'}</p>
          <p><strong>Phone:</strong> {data.phone || '-'}</p>
        </div>

        <div className={styles['dashboard-info']}>
          <p><strong>City:</strong> {data.city || '-'}</p>
          <p><strong>Country:</strong> {data.country || '-'}</p>
          <p><strong>Level:</strong> {data.level || '-'}</p>
          <p><strong>Bio:</strong><br />{data.intro || '-'}</p>
          <p><strong>Goals:</strong></p>
          <ul>
            {data.goals && data.goals.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* KUPONLAR 
      <div className={styles.couponSection}>
        <h3>🎟️ Your Coupons</h3>
        {(!data.lessonCoupons?.length && !data.subscriptionCoupons?.length) ? (
          <p>No coupons available.</p>
        ) : (
          <>
            {data.lessonCoupons?.length > 0 && (
              <div>
                <h4>Lesson Coupons</h4>
                <ul>
                  {data.lessonCoupons.map((c, i) => (
                    <li key={i}>
                      <b>{c.code}</b> — {c.discount}% off {c.used ? "(Used)" : "(Available)"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.subscriptionCoupons?.length > 0 && (
              <div>
                <h4>Subscription Coupons</h4>
                <ul>
                  {data.subscriptionCoupons.map((c, i) => (
                    <li key={i}>
                      <b>{c.code}</b> — {c.discount}% off {c.used ? "(Used)" : "(Available)"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
      */}

      {/* REZERVASYONLAR */}
      <div className={styles['dashboard-reservations']}>
        <h3>Your Reservations</h3>
        <div className={styles['dashboard-reservations-list']}>
          {sortedBookings.length === 0 ? (
            <p>No reservations yet.</p>
          ) : (
            sortedBookings.map((b, i) => {
              const reviewed = reviews[b.id];
              const teacher = teachers[b.teacherId] || {};
              return (
                <div key={i} className={styles['dashboard-card']}>
                  {teacher.profilePhotoUrl && (
                    <Image
                      src={teacher.profilePhotoUrl}
                      alt="Teacher"
                      className={styles['dashboard-card-img']}
                      width={120}
                      height={120}
                    />
                  )}
                  <div className={styles['dashboard-card-body']}>
                    <p><strong>Teacher:</strong> {teacher.name || 'N/A'}</p>
                    <p><strong>Date:</strong> {b.date}</p>
                    <p><strong>Time:</strong> {b.startTime} – {b.endTime}</p>
                    <p><strong>Duration:</strong> {b.duration} min</p>
                    <p><strong>Location:</strong> {b.location}</p>
                    <p><strong>Status:</strong> {b.status}</p>
                    {b.meetingLink && (
                      <a href={b.meetingLink} target="_blank" rel="noopener noreferrer">
                        Join Online Lesson
                      </a>
                    )}
                    {b.status === 'approved' && !reviewed && (
                      <button onClick={() => router.push(`/student/review/${b.id}`)}>
                        ✍️ Leave a Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
