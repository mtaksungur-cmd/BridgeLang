// pages/teacher/dashboard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '../../lib/firebase';
import {
  doc, getDoc, collection, query, where, getDocs, updateDoc
} from 'firebase/firestore';
import Image from 'next/image';
import { onAuthStateChanged } from 'firebase/auth';
import styles from '../../scss/TeacherDashboard.module.scss';

const BADGE_DEFS = [
  { key: '🆕 New Teacher', desc: 'Granted automatically during the first 30 days after registration.' },
  { key: '💼 Active Teacher', desc: 'Taught at least 8 approved lessons in the last 3 months.' },
  { key: '🌟 5-Star Teacher', desc: 'Average rating of 4.8 or higher in the last 20 lessons.' },
];

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewUsers, setReviewUsers] = useState({});
  const router = useRouter();

  // ----------------------------
  // LOAD TEACHER + BADGES + REVIEWS
  // ----------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push('/login');

      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return router.push('/login');

      const userData = snap.data();
      if (userData.role !== 'teacher') return router.push('/student/dashboard');
      if (!userData?.stripeOnboarded) return router.push('/teacher/stripe-connect');

      const now = new Date();
      const createdAt = userData.createdAt?.toDate?.() || new Date(userData.createdAt);
      const diffDays = Math.floor((Date.now() - createdAt.getTime()) / 86400000);

      const cutoffActive = new Date();
      cutoffActive.setDate(now.getDate() - 90);

      const bookingsQ = query(
        collection(db, 'bookings'),
        where('teacherId', '==', user.uid),
        where('status', '==', 'approved')
      );
      const bookingsSnap = await getDocs(bookingsQ);
      const lessons = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const activeLessonCount = lessons.filter(b => {
        const d = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return d >= cutoffActive;
      }).length;

      const sortedByDate = lessons
        .map(b => ({ ...b, d: b.createdAt?.toDate?.() || new Date(b.createdAt) }))
        .sort((a, b) => b.d - a.d);

      const recent20 = sortedByDate.slice(0, 20);

      const reviewQ = query(collection(db, 'reviews'), where('teacherId', '==', user.uid));
      const reviewSnap = await getDocs(reviewQ);
      const reviewsArr = reviewSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReviews(reviewsArr);

      const userMap = {};
      for (const r of reviewsArr) {
        if (r.studentId && !userMap[r.studentId]) {
          const s = await getDoc(doc(db, 'users', r.studentId));
          if (s.exists()) userMap[r.studentId] = s.data();
        }
      }
      setReviewUsers(userMap);

      const recent20Ids = recent20.map(l => l.id);
      const recent20Reviews = reviewsArr.filter(r => recent20Ids.includes(r.lessonId));
      const recent20Avg = recent20Reviews.length
        ? recent20Reviews.reduce((a, b) => a + (b.rating || 0), 0) / recent20Reviews.length
        : 0;

      const earnedBadges = [];
      if (diffDays <= 30) earnedBadges.push('🆕 New Teacher');
      if (activeLessonCount >= 8) earnedBadges.push('💼 Active Teacher');
      if (recent20Avg >= 4.8 && recent20.length >= 20) earnedBadges.push('🌟 5-Star Teacher');

      const studentIds = [...new Set(lessons.map(b => b.studentId))];
      const repeatStudentIds = studentIds.filter(id =>
        lessons.filter(b => b.studentId === id).length > 1
      );
      const repeatRate = studentIds.length ? repeatStudentIds.length / studentIds.length : 0;

      const avgRating = reviewsArr.length
        ? reviewsArr.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsArr.length
        : 0;

      const totalEarnings = userData.totalEarnings || 0;

      await updateDoc(ref, {
        badges: earnedBadges,
        totalLessons: lessons.length,
        repeatRate,
        avgRating,
        totalEarnings,
      });

      const fullData = {
        ...userData,
        uid: user.uid,
        totalLessons: lessons.length,
        repeatRate,
        avgRating,
        totalEarnings,
        badges: earnedBadges,
      };

      setData(fullData);
      setForm({
        bio: fullData.bio || '',
        city: fullData.city || '',
        postcode: fullData.postcode || '',
        homeAddress: fullData.homeAddress || '',
        educationLevel: fullData.educationLevel || '',
        experienceYears: fullData.experienceYears ?? '',
        languagesTaught: fullData.languagesTaught || '',
        languagesSpoken: fullData.languagesSpoken || '',
        teachingSpecializations: fullData.teachingSpecializations || '',
        studentAges: fullData.studentAges || '',
        deliveryMethod: fullData.deliveryMethod || '',
        willingToTravel: !!fullData.willingToTravel,
        pricing30: fullData.pricing30 ?? '',
        pricing45: fullData.pricing45 ?? '',
        pricing60: fullData.pricing60 ?? '',
      });

      setDirty(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // ----------------------------
  // PROFILE PHOTO UPLOAD
  // ----------------------------
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !data?.uid) return;
    setUploading(true);
    setMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await res.json();
      if (!result.url) throw new Error('Upload failed');

      await updateDoc(doc(db, 'users', data.uid), { profilePhotoUrl: result.url });
      setData(prev => ({ ...prev, profilePhotoUrl: result.url }));
      setMsg('✅ Profile photo updated!');
    } catch {
      setMsg('❌ Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  // ----------------------------
  // HANDLE FORM CHANGE
  // ----------------------------
  const handleChange = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: value,
    }));
    setDirty(true);
  };

  // ----------------------------
  // SAVE CHANGES
  // ----------------------------
  const handleSave = async () => {
    if (!data?.uid || !form || !dirty) return;
    setSaving(true);
    setMsg('');

    try {
      const payload = {
        bio: form.bio.trim(),
        city: form.city.trim(),
        postcode: form.postcode.trim(),
        homeAddress: form.homeAddress.trim(),
        educationLevel: form.educationLevel.trim(),
        experienceYears: form.experienceYears,
        languagesTaught: form.languagesTaught.trim(),
        languagesSpoken: form.languagesSpoken.trim(),
        teachingSpecializations: form.teachingSpecializations.trim(),
        studentAges: form.studentAges.trim(),
        deliveryMethod: form.deliveryMethod.trim(),
        willingToTravel: !!form.willingToTravel,
        pricing30: form.pricing30 === '' ? null : Number(form.pricing30),
        pricing45: form.pricing45 === '' ? null : Number(form.pricing45),
        pricing60: form.pricing60 === '' ? null : Number(form.pricing60),
      };

      await updateDoc(doc(db, 'users', data.uid), payload);
      setData(prev => ({ ...prev, ...payload }));
      setDirty(false);
      setMsg('✅ Changes saved successfully.');
    } catch (e) {
      console.error(e);
      setMsg('❌ Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className={styles.loading}>Loading…</p>;
  if (!data || !form) return null;

  return (
    <div className={styles.wrap}>
      {/* HEADER */}
      <header className={styles.header}>
        <h2>👨‍🏫 Teacher Dashboard</h2>
      </header>

      {/* PROFILE SECTION */}
      <section className={styles.profile}>
        <div className={styles.profile__left}>
          <Image
            className={styles.profile__avatar}
            src={data.profilePhotoUrl}
            alt="Profile"
            width={160}
            height={160}
          />

          <label className={styles.profile__uploadLabel}>
            <span>Change Profile Photo</span>
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
          </label>
          {uploading && <p className={styles.info}>Uploading…</p>}
          {msg && <p className={msg.startsWith('✅') ? styles.ok : styles.err}>{msg}</p>}
        </div>

        {/* RIGHT SIDE INFO */}
        <div className={styles.profile__right}>
          <div className={styles.statGrid}>

            {/* Name */}
            <div className={styles.stat}>
              <div className={styles.stat__label}>Name</div>
              <div className={styles.stat__value}>{data.name}</div>
            </div>

            {/* Email */}
            <div className={styles.stat}>
              <div className={styles.stat__label}>Email</div>
              <div className={styles.stat__value}>{data.email}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.stat__label}>Total Earnings</div>
              <div className={styles.stat__value}>£{(data.totalEarnings || 0).toFixed(2)}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.stat__label}>Total Lessons</div>
              <div className={styles.stat__value}>{data.totalLessons}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.stat__label}>Average Rating</div>
              <div className={styles.stat__value}>
                {data.avgRating ? data.avgRating.toFixed(1) : '0.0'} ⭐
              </div>
            </div>
            <div className={styles.stat}>
              <div className={styles.stat__label}>Repeat Rate</div>
              <div className={styles.stat__value}>{Math.round((data.repeatRate || 0) * 100)}%</div>
            </div>

            {/* BIO */}
            <div className={styles.stat}>
              <div className={styles.stat__label}>Bio</div>
              <textarea
                value={form.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                className={styles.input}
              />
            </div>

            {/* CITY */}
            <div className={styles.stat}>
              <div className={styles.stat__label}>City</div>
              <input
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className={styles.input}
              />
            </div>

            {/* POSTCODE */}
            <div className={styles.stat}>
              <div className={styles.stat__label}>Postcode</div>
              <input
                value={form.postcode}
                onChange={(e) => handleChange('postcode', e.target.value)}
                className={styles.input}
              />
            </div>

            {/* ADDRESS */}
            <div className={styles.stat}>
              <div className={styles.stat__label}>Address</div>
              <input
                value={form.homeAddress}
                onChange={(e) => handleChange('homeAddress', e.target.value)}
                className={styles.input}
              />
            </div>

            {/* EDUCATION LEVEL */}
            <div className={styles.stat}>
              <div className={styles.stat__label}>Education Level</div>
              <input
                value={form.educationLevel}
                onChange={(e) => handleChange('educationLevel', e.target.value)}
                className={styles.input}
              />
            </div>

            {/* EXPERIENCE YEARS */}
            <div className={styles.stat}>
              <div className={styles.stat__label}>Experience (Years)</div>
              <input
                type="number"
                value={form.experienceYears}
                onChange={(e) => handleChange('experienceYears', e.target.value)}
                className={styles.input}
              />
            </div>

            {/* LANGUAGES TAUGHT */}
            <div className={styles.stat}>
              <div className={styles.stat__label}>Languages Taught</div>
              <input
                value={form.languagesTaught}
                onChange={(e) => handleChange('languagesTaught', e.target.value)}
                className={styles.input}
              />
            </div>

            {/* LANGUAGES SPOKEN */}
            <div className={styles.stat}>
              <div className={styles.stat__label}>Languages Spoken</div>
              <input
                value={form.languagesSpoken}
                onChange={(e) => handleChange('languagesSpoken', e.target.value)}
                className={styles.input}
              />
            </div>

            {/* SPECIALISATIONS */}
            <div className={styles.stat}>
              <div className={styles.stat__label}>Teaching Specializations</div>
              <textarea
                value={form.teachingSpecializations}
                onChange={(e) => handleChange('teachingSpecializations', e.target.value)}
                className={styles.input}
              />
            </div>

            {/* STUDENT AGES */}
            <div className={styles.stat}>
              <div className={styles.stat__label}>Student Ages</div>
              <input
                value={form.studentAges}
                onChange={(e) => handleChange('studentAges', e.target.value)}
                className={styles.input}
              />
            </div>

            {/* DELIVERY METHOD (TEXT INPUT) */}
            <div className={styles.stat}>
              <div className={styles.stat__label}>Delivery Method</div>
              <input
                value={form.deliveryMethod}
                placeholder="e.g. Online or In Person"
                onChange={(e) => handleChange('deliveryMethod', e.target.value)}
                className={styles.input}
              />
            </div>

            {/* WILLING TO TRAVEL */}
            <div className={styles.stat}>
              <div className={styles.stat__label}>Willing To Travel</div>
              <select
                value={form.willingToTravel ? 'yes' : 'no'}
                onChange={(e) => handleChange('willingToTravel', e.target.value === 'yes')}
                className={styles.input}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            {/* ------- PRICES ------- */}
            <div className={styles.stat}>
              <div className={styles.stat__label}>30 min Price (£)</div>
              <input
                type="number"
                value={form.pricing30}
                onChange={(e) => handleChange('pricing30', e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.stat}>
              <div className={styles.stat__label}>45 min Price (£)</div>
              <input
                type="number"
                value={form.pricing45}
                onChange={(e) => handleChange('pricing45', e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.stat}>
              <div className={styles.stat__label}>60 min Price (£)</div>
              <input
                type="number"
                value={form.pricing60}
                onChange={(e) => handleChange('pricing60', e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            {saving ? 'Saving…' : dirty ? 'Save Changes' : 'No Changes'}
          </button>
        </div>
      </section>

      {/* BADGES */}
      <section className={styles.badges}>
        <h3>Your Badges & Progress</h3>
        <ul className={styles.badges__list}>
          {BADGE_DEFS.map(b => (
            <li
              key={b.key}
              className={`${styles.badges__item} ${
                data.badges?.includes(b.key) ? styles['badges__item--on'] : ''
              }`}
            >
              <span className={styles.badges__name}>{b.key}</span>
              <span className={styles.badges__desc}>{b.desc}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* REVIEWS */}
      <section className={styles.reviews}>
        <h3>Student Reviews</h3>
        {reviews.length === 0 ? (
          <p className={styles.muted}>No reviews yet.</p>
        ) : (
          <div className={styles.reviewList}>
            {reviews.map((r) => {
              const student = reviewUsers[r.studentId];
              return (
                <div key={r.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    {student?.profilePhotoUrl && (
                      <Image
                        src={student.profilePhotoUrl}
                        className={styles.reviewAvatar}
                        alt={student?.name}
                        width={40}
                        height={40}
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
      </section>
    </div>
  );
}
