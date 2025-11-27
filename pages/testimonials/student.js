// pages/testimonials/students.js
'use client';

import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import styles from '../../scss/Testimonials.module.scss';

export default function StudentTestimonialsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const col = collection(db, 'reviews');
        const q = query(col, where('review_type', '==', 'platform_student'));
        const snap = await getDocs(q);

        const list = snap.docs
          .map(d => d.data())
          .filter(r => !r.hidden)
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        setReviews(list);
      } catch (e) {
        console.error('load testimonials error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const renderStars = (n) => '⭐'.repeat(Number(n || 0));

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Student Testimonials</h1>
      <p className={styles.subtitle}>Real feedback from students using BridgeLang.</p>

      {loading ? (
        <p>Loading...</p>
      ) : reviews.length === 0 ? (
        <p>No testimonials yet.</p>
      ) : (
        <div className={styles.grid}>
          {reviews.map((r, idx) => (
            <div key={idx} className={styles.card}>
              <div className={styles.header}>
                
                {/* FOTOĞRAF YERİ → boş avatar her zaman gözükecek */}
                <div className={styles.avatarWrapper}>
                  {r.display_photo ? (
                    <img src={r.display_photo} alt={r.display_name} className={styles.avatar} />
                  ) : (
                    <div className={styles.avatarPlaceholder}></div>
                  )}
                </div>

                <div>
                  <strong>{r.display_name}</strong>
                  <div>{renderStars(r.rating)}</div>
                </div>
              </div>

              <p className={styles.comment}>{r.comment || ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
