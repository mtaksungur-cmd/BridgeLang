import { useEffect, useMemo, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import styles from "../../scss/TeachersList.module.scss";

const badgeDescriptions = {
  '🆕 New Teacher': '(first 30 days)',
  '💼 Active Teacher': '(8+ lessons in last 3 months)',
  '🌟 5-Star Teacher': '(avg rating ≥ 4.8 in last 20 lessons)',
};

export default function TeachersList() {
  const [allTeachers, setAllTeachers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState("");
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const fetchTeachers = async () => {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'teacher'),
        where('status', '==', 'approved')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const reviewMap = {};
      for (const t of data) {
        const rq = query(collection(db, 'reviews'), where('teacherId', '==', t.id));
        const rs = await getDocs(rq);
        reviewMap[t.id] = rs.docs.map(d => d.data().rating);
      }

      const withRatings = data.map(t => {
        const ratings = reviewMap[t.id] || [];
        const avg = ratings.length
          ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
          : null;
        const badges = t.badges || [];
        const latestBadge = badges.length ? badges[badges.length - 1] : null;
        return { ...t, avgRating: avg, reviewCount: ratings.length, latestBadge, badges };
      });

      withRatings.sort((a, b) => {
        if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
        return (b.avgRating || 0) - (a.avgRating || 0);
      });

      setAllTeachers(withRatings);
      setTeachers(withRatings);
      setLoading(false);
    };

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setActivePlan("free");
        return;
      }

      try {
        const sSnap = await getDoc(doc(db, "users", user.uid));
        if (sSnap.exists()) {
          const data = sSnap.data();
          setActivePlan(data.subscriptionPlan || "free");
        }
      } catch (err) {
        console.error("checkPlan error:", err);
      }
    });

    fetchTeachers();

    return () => unsubscribe();
  }, []);

  const citiesForCountry = useMemo(() => {
    const set = new Set(
      allTeachers
        .filter(t => !country || (t.country || '').toLowerCase() === country.toLowerCase())
        .map(t => (t.city || '').trim())
        .filter(Boolean)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allTeachers, country]);

  useEffect(() => {
    const f = allTeachers.filter(t => {
      const ctry = (t.country || '').toLowerCase();
      const cty = (t.city || '').toLowerCase();
      const okCountry = country ? ctry === country.toLowerCase() : true;
      const okCity = city ? cty === city.toLowerCase() : true;
      return okCountry && okCity;
    });
    setTeachers(f);
  }, [allTeachers, country, city]);

  const clearFilters = () => {
    setCountry('');
    setCity('');
  };

  if (loading) return <p className={styles.loading}>Loading teachers...</p>;

  return (
    <div className={styles.container}>
      <h2>Browse Our Tutors</h2>
      <p className={styles.subtitle}>
        All BridgeLang tutors are fully verified and approved for quality and professionalism.
      </p>

      <p className={styles.highlight}>
        New to BridgeLang? Start with a <strong>30-minute</strong> lesson,
        even on the <strong>Free Plan</strong> — no pressure, no commitment.
      </p>

      <div className={styles.filters}>
        <div className={styles.filterItem}>
          <label htmlFor="country">Country</label>
          <input
            id="country"
            type="text"
            placeholder="e.g., England"
            value={country}
            onChange={(e) => { setCountry(e.target.value); setCity(''); }}
          />
        </div>

        <div className={styles.filterItem}>
          <label htmlFor="city">City</label>
          <input
            id="city"
            type="text"
            placeholder="e.g., London"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            list="cities"
            disabled={!country && citiesForCountry.length === 0}
          />
          <datalist id="cities">
            {citiesForCountry.map(ct => <option key={ct} value={ct} />)}
          </datalist>
        </div>

        <div className={styles.filterActions}>
          <button className={styles.clearBtn} onClick={clearFilters} disabled={!country && !city}>
            Clear
          </button>
          <div className={styles.resultCount}>
            {teachers.length} result{teachers.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {teachers.map(t => {
          const cityTxt = t.city || '—';
          const countryTxt = t.country || '—';
          const price30 = t.pricing30 || 0;

          return (
            <div key={t.id} className={styles.card}>
              <div className={styles.cardHeader}>
                {t.profilePhotoUrl && (
                  <Image
                    src={t.profilePhotoUrl}
                    alt={t.name}
                    className={styles.avatar}
                    width={60}
                    height={60}
                  />
                )}
                <div className={styles.headerInfo}>
                  <Link href={`/student/teachers/${t.id}`} className={styles.teacherName}>
                    {t.name}
                  </Link>
                  {t.verified && (
                    <p className={styles.verified}>Verified</p>
                  )}
                </div>
              </div>

              <div className={styles.priceSection}>
                <span className={styles.priceLabel}>From</span>
                <span className={styles.priceAmount}>£{price30}</span>
                <span className={styles.priceDuration}>30 min</span>
              </div>

              <div className={styles.availability}>
                <span className={styles.availIcon}>🕐</span>
                <span>30 min</span>
                <span className={styles.separator}>|</span>
                <span>45 min</span>
                <span className={styles.separator}>|</span>
                <span>60 min</span>
              </div>

              {t.intro && (
                <p className={styles.bio}>{t.intro.substring(0, 100)}...</p>
              )}

              {t.avgRating && (
                <div className={styles.ratingRow}>
                  <span className={styles.stars}>⭐⭐⭐⭐⭐</span>
                  <span className={styles.ratingValue}>{t.avgRating}</span>
                  <span className={styles.reviewCount}>{t.reviewCount} Reviews</span>
                </div>
              )}

              <div className={styles.badgeContainer}>
                <span className={styles.introBadge}>
                  15-min Intro
                </span>
                {t.badges && t.badges.filter(b => b !== '🆕 New Teacher').map((b, i) => (
                  <span key={i} className={styles.badge}>
                    {b.replace(/[🆕💼🌟]/g, '').trim()}
                  </span>
                ))}
              </div>

              <button
                className={styles.bookBtn}
                onClick={() => router.push(`/student/teachers/${t.id}`)}
              >
                Book a 30-min Lesson
              </button>

              <Link href={`/student/teachers/${t.id}`} className={styles.viewProfile}>
                View profile
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
