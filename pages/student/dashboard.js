import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import {
  doc, getDoc, updateDoc, collection, query, where, getDocs
} from 'firebase/firestore';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import SubscriptionBanner from '../../components/SubscriptionBanner';
import LoyaltyBadge from '../../components/LoyaltyBadge';
import { getLoyaltyInfo } from '../../lib/loyalty';
import { useSubscriptionGuard } from '../../lib/subscriptionGuard';
import styles from '../../scss/StudentDashboard.module.scss';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchBookings = async (uid) => {
    const q = query(collection(db, 'bookings'), where('studentId', '==', uid), where('status', 'in', ['confirmed', 'approved']));
    const snap = await getDocs(q);
    const bookingsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBookings(bookingsList);
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  const plan = data?.subscriptionPlan || 'free';
  const planNames = { free: 'Free Plan', starter: 'Starter Plan', pro: 'Pro Plan', vip: 'VIP Plan' };
  const planName = planNames[plan] || 'Free Plan';
  const viewsLeft = data?.viewLimit || 10;
  const messagesLeft = data?.messagesLeft || 5;
  const hasBookings = bookings.length > 0;

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

      <div className={styles.welcomeBanner}>
        <h1>Welcome to BridgeLang!</h1>
        <p>Ready to get started? Book your first lesson today.</p>
        <Link href="/student/teachers" className={styles.browseBtn}>
          Browse Tutors & Book Your First Lesson
        </Link>
      </div>

      <h2 className={styles.dashboardTitle}>Student Dashboard</h2>

      <div className={styles.gridContainer}>
        <div className={styles.actionCard}>
          <div className={styles.userHeader}>
            <div className={styles.avatar}>
              {data.name ? data.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h3>{data.name}</h3>
              <p className={styles.subtitle}>Goal: {data.level || 'General English'}</p>
            </div>
          </div>

          <div className={styles.nextStep}>
            <span className={styles.stepIcon}>●</span>
            <span className={styles.stepLabel}>Next Step:</span>
          </div>

          <h3 className={styles.stepTitle}>
            {hasBookings ? 'Browse More Tutors' : 'Book your First Lesson'}
          </h3>

          <Link href="/student/teachers" className={styles.browseTutorsBtn}>
            Browse Tutors
          </Link>

          <Link href="/account/reviews" className={styles.manageLink}>
            Manage Account
          </Link>
        </div>

        <div className={styles.planCard}>
          <h3>{planName} Details</h3>

          <div className={styles.planRow}>
            <span>Profile Views Left</span>
            <span className={styles.planValue}>{viewsLeft}</span>
          </div>
          <p className={styles.planDesc}>You can view up to {viewsLeft} tutor profiles this month on the {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan.</p>

          <div className={styles.planRow}>
            <span>Messages Left</span>
            <span className={styles.planValue}>{messagesLeft}</span>
          </div>
          <p className={styles.planDesc}>You can message up to {messagesLeft} tutors each month on the {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan.</p>

          <Link href="/student/subscription" className={styles.usageLink}>
            Show usage details →
          </Link>
        </div>
      </div>

      <div className={styles.reminderCard}>
        <div className={styles.reminderHeader}>
          <span className={styles.reminderIcon}>💡</span>
          <h3>Availability Reminder</h3>
        </div>
        <p className={styles.reminderTip}>
          <strong>Pro tip:</strong> Check tutor availability to book a lesson soon.
        </p>
        <p className={styles.reminderText}>
          Tutors can fill up fast, so look for tutors with times available in the next few days.
        </p>
        <Link href="/student/teachers" className={styles.reminderLink}>
          Browse available tutors →
        </Link>
      </div>
    </div>
  );
}
