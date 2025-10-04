import { useEffect, useMemo, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import SubscriptionBanner from "../../components/SubscriptionBanner";
import { useRouter } from 'next/router';
import styles from "../../scss/TeachersList.module.scss";

export default function TeachersList() {
  const [allTeachers, setAllTeachers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState("");
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const router = useRouter();

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
        const q = query(
          collection(db, 'reviews'),
          where('teacherId', '==', t.id)
        );
        const rs = await getDocs(q);
        reviewMap[t.id] = rs.docs.map(d => d.data().rating);
      }

      const withRatings = data.map(t => {
        const ratings = reviewMap[t.id] || [];
        const avg = ratings.length
          ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
          : null;
        const badges = t.badges || [];
        const latestBadge = badges.length ? badges[badges.length - 1] : null;
        return { ...t, avgRating: avg, reviewCount: ratings.length, latestBadge };
      });

      withRatings.sort((a, b) => {
        if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
        return (b.avgRating || 0) - (a.avgRating || 0);
      });

      setAllTeachers(withRatings);
      setTeachers(withRatings);
      setLoading(false);
    };

    const checkPlan = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const sSnap = await getDoc(doc(db, "users", user.uid));
      if (sSnap.exists()) setActivePlan(sSnap.data().subscriptionPlan || "free");
    };

    fetchTeachers();
    checkPlan();
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
    <div>
      <SubscriptionBanner />
      <div className={styles.container}>
        <h2>Browse Our Teachers</h2>

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

                  {t.latestBadge && <p className={styles.badge}>{t.latestBadge}</p>}

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

                  <button
                    className={styles.reportBtn}
                    onClick={() => router.push(`/student/report?target=${t.id}`)}
                  >
                    🛑 Report
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
