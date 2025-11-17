import { useEffect, useMemo, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import SubscriptionBanner from "../../components/SubscriptionBanner";
import LoyaltyBadge from "../../components/LoyaltyBadge";
import { getLoyaltyInfo } from '../../lib/loyalty';
import { useSubscriptionGuard } from '../../lib/subscriptionGuard';
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
  const [lessonsTaken, setLessonsTaken] = useState(0);
  const [subscriptionCoupons, setSubscriptionCoupons] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // ✅ login kontrolü
  const router = useRouter();

  useEffect(() => {
    // 🔹 login durumu dinleniyor
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
  
    // 🔹 Kullanıcı verisini al
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
          setLessonsTaken(data.lessonsTaken || 0);
          setSubscriptionCoupons(data.subscriptionCoupons || []);
        }
      } catch (err) {
        console.error("checkPlan error:", err);
      }
    });
  
    fetchTeachers();
  
    // cleanup
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

      <div className={styles.filters} role="region" aria-label="Filters">
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
          const travel =
            typeof t.willingToTravel === 'boolean'
              ? (t.willingToTravel ? 'Yes' : 'No')
              : '—';
          const delivery = t.deliveryMethod || '—';

          return (
            <div
              key={t.id}
              className={styles.card}
              onClick={() => router.push(`/student/teachers/${t.id}`)}
            >
              <div className={styles.cardContent}>
                <Link href={`/student/teachers/${t.id}`}>
                  <h3 className={styles.teacherName}>{t.name}</h3>
                </Link>

                {t.avgRating ? (
                  <p className={styles.rating}>
                    ⭐ {t.avgRating} <span className={styles.reviewCount}>({t.reviewCount})</span>
                  </p>
                ) : (
                  <p className={styles.rating}>⭐ No reviews yet</p>
                )}

                {/* 🔹 Rozetler (badge + açıklama) */}
                {Array.isArray(t.badges) && t.badges.length > 0 ? (
                  <div className={styles.badgeWrap}>
                    {t.badges.map((b, i) => (
                      <span key={i} className={styles.badge}>
                        {b} <small>{badgeDescriptions[b] || ''}</small>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className={styles.badge}>No badges yet</p>
                )}

                {t.profilePhotoUrl && (
                  <Image
                    src={t.profilePhotoUrl}
                    alt="Profile"
                    className={styles.profileImg}
                    width={100}
                    height={100}
                  />
                )}

                <p><strong>Location:</strong> {cityTxt}, {countryTxt}</p>
                <p><strong>Willing to travel:</strong> {travel}</p>
                <p><strong>Delivery method:</strong> {delivery}</p>
                <p><strong>Languages:</strong> {t.languagesTaught || '—'}</p>
                <p><strong>Experience:</strong> {t.experienceYears ? `${t.experienceYears} years` : '—'}</p>
                <p><strong>Price:</strong><br />
                  30 min: £{t.pricing30 ?? '—'}<br />
                  45 min: £{t.pricing45 ?? '—'}<br />
                  60 min: £{t.pricing60 ?? '—'}
                </p>

                {/* 🔹 Report butonu sadece giriş yapanlara görünür */}
                {isLoggedIn && (
                  <button
                    className={styles.reportBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/student/report?target=${t.id}`);
                    }}
                  >
                    🛑 Report
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
