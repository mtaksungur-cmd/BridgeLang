'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import styles from '../../scss/PlatformReview.module.scss';

function buildAnonName(full) {
  const parts = (full || '').trim().split(/\s+/);
  const f = parts[0] || '';
  const l = parts[parts.length - 1] || '';
  const m = (x) => (x ? `${x[0]}****` : '');
  return `${m(f)} ${m(l)}`.trim();
}

export default function PlatformReviewPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [consented, setConsented] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) return router.replace('/login');
      setUser(u);

      const snap = await getDoc(doc(db, 'users', u.uid));
      if (snap.exists()) {
        setProfile(snap.data());
      }
    });
    return () => unsub();
  }, []);

  // ==============================================================  
  // 🔥 HANDLE SUBMIT WITH COMMENT NORMALISATION  
  // ==============================================================  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);

    try {
      const fullName = profile.name || 'Anonymous';

      const displayName = consented ? fullName : buildAnonName(fullName);
      const displayPhoto = consented ? profile.profilePhotoUrl || null : null;

      let review_type =
        profile.role === 'teacher'
          ? 'platform_teacher'
          : 'platform_student';

      // ======================================================
      // 🔥 FRONTEND COMMENT CLEANING
      // ======================================================
      let cleanedComment = (comment || "")
        .normalize("NFKC")
        .replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, "") // zero-width chars
        .replace(/\u2028|\u2029/g, "") // line separators
        .trim();

      const res = await fetch('/api/review/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          review_type,
          rating,
          comment: cleanedComment,
          user_consented: consented,
          display_name: displayName,
          display_photo: displayPhoto,
          fullName: fullName,
          profilePhotoUrl: profile.profilePhotoUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Thank you for your feedback!');
      router.push('/account/reviews');
    } catch (err) {
      console.error(err);
      alert('Failed to submit.');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <p>Loading…</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Leave a Review for the Platform</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label>Rating</label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className={styles.input}
        >
          {[5,4,3,2,1].map((n) => (
            <option key={n} value={n}>{n} Stars</option>
          ))}
        </select>

        <label>Comment</label>
        <textarea
          className={styles.textarea}
          rows="4"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
          />
          I agree for my full name and profile photo to be publicly displayed with my review
        </label>

        <button disabled={saving} className={styles.submitBtn}>
          {saving ? 'Saving...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}
