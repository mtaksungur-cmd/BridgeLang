'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import styles from '../../scss/AccountReviews.module.scss';

function buildAnonName(fullName) {
  const name = (fullName || 'Anonymous').trim();
  const parts = name.split(/\s+/);
  const first = parts[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1] : '';
  const mask = (s) => (s ? `${s[0]}****` : '');
  const anon =
    (first ? mask(first) : '') +
    (last ? ` ${mask(last)}` : '');
  return anon || 'Anonymous';
}

export default function AccountReviewsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  // ⭐️ Edit Modu
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // Login + role
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        router.replace('/login');
      } else {
        setUser(u);

        const snap = await getDocs(
          query(collection(db, 'users'), where('__name__', '==', u.uid))
        );
        if (!snap.empty) {
          setUserRole(snap.docs[0].data().role || 'student');
        }
      }
    });
    return () => unsub();
  }, [router]);

  // Reviews load
  useEffect(() => {
    if (!user || !userRole) return;

    const fetchReviews = async () => {
      setLoading(true);

      try {
        const col = collection(db, 'reviews');
        let q1 = [];
        let q2 = [];

        if (userRole === 'student') {
          q1 = query(col, where('studentId', '==', user.uid));
          q2 = query(col, where('userId', '==', user.uid));
        }

        if (userRole === 'teacher') {
          q1 = query(col, where('userId', '==', user.uid));
        }

        const [s1, s2] = await Promise.all([
          getDocs(q1),
          userRole === 'student' ? getDocs(q2) : Promise.resolve({ docs: [] }),
        ]);

        const list = [
          ...s1.docs.map((d) => ({ id: d.id, ...d.data() })),
          ...s2.docs.map((d) => ({ id: d.id, ...d.data() })),
        ].sort(
          (a, b) =>
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

        setReviews(list);
      } catch (e) {
        console.error('load reviews error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [user, userRole]);

  // 🔹 Visibility toggle
  const handleToggleHidden = async (r) => {
    setSavingId(r.id);
    try {
      const newHidden = !r.hidden;
      await updateDoc(doc(db, 'reviews', r.id), { hidden: newHidden });

      setReviews((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, hidden: newHidden } : x))
      );
    } catch (e) {
      console.error('hide toggle error', e);
      alert('Failed to update visibility.');
    } finally {
      setSavingId(null);
    }
  };

  // 🔹 Consent toggle
  const handleToggleConsent = async (r) => {
    setSavingId(r.id);
    try {
      const newConsented = !r.user_consented;

      const update = { user_consented: newConsented };

      if (newConsented) {
        update.display_name = r.fullName || r.display_name || 'Anonymous';
        update.display_photo = r.profilePhotoUrl || r.display_photo || null;
        update.consentGivenAt = new Date().toISOString();
      } else {
        update.display_name = buildAnonName(
          r.display_name || r.fullName || ''
        );
        update.display_photo = null;
        update.consentGivenAt = null;
      }

      await updateDoc(doc(db, 'reviews', r.id), update);

      setReviews((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, ...update } : x))
      );
    } catch (e) {
      console.error('consent toggle error', e);
      alert('Failed.');
    } finally {
      setSavingId(null);
    }
  };

  // 🔹 Delete
  const handleDelete = async (r) => {
    if (!confirm('Delete this review permanently?')) return;
    setSavingId(r.id);
    try {
      await deleteDoc(doc(db, 'reviews', r.id));
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
    } catch (e) {
      console.error('delete review error', e);
      alert('Failed.');
    } finally {
      setSavingId(null);
    }
  };

  // ⭐️ Edit Save
  const handleSaveEdit = async (r) => {
    if (!editText.trim()) return alert("Comment cannot be empty.");

    setSavingId(r.id);
    try {
      await updateDoc(doc(db, 'reviews', r.id), {
        comment: editText.trim(),
        updatedAt: new Date().toISOString(),
      });

      setReviews((prev) =>
        prev.map((x) =>
          x.id === r.id ? { ...x, comment: editText.trim() } : x
        )
      );

      setEditingId(null);
      setEditText("");

    } catch (e) {
      console.error("edit error:", e);
      alert("Failed to save changes.");
    } finally {
      setSavingId(null);
    }
  };

  if (!user || !userRole) return null;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {userRole === 'student' ? 'My Reviews' : 'My Tutor Reviews'}
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : reviews.length === 0 ? (
        <p>You have not written any reviews yet.</p>
      ) : (
        <div className={styles.list}>
          {reviews.map((r) => (
            <div key={r.id} className={styles.card}>
              
              {/* TOP BAR */}
              <div className={styles.rowTop}>
                <span className={styles.type}>
                  {r.review_type === 'teacher_review'
                    ? 'Lesson Review'
                    : r.review_type === 'platform_student'
                    ? 'Platform Review (Student)'
                    : r.review_type === 'platform_teacher'
                    ? 'Platform Review (Tutor)'
                    : 'Review'}
                </span>

                {r.rating && (
                  <span className={styles.rating}>
                    {'★'.repeat(r.rating)}
                  </span>
                )}
              </div>

              {/* COMMENT AREA */}
              {editingId === r.id ? (
                <textarea
                  className={styles.editTextarea}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
              ) : (
                <p className={styles.comment}>{r.comment || '(no comment)'}</p>
              )}

              <div className={styles.meta}>
                <span>
                  Consent:{' '}
                  {r.user_consented
                    ? 'Full name & photo visible'
                    : 'Anonymous'}
                </span>
              </div>

              <div className={styles.footerRow}>
                
                {/* Visible toggle */}
                <div className={styles.toggleGroup}>
                  <span className={styles.toggleText}>
                    {r.hidden ? 'Hidden' : 'Visible'}
                  </span>
                  <div
                    className={`${styles.toggleWrapper} ${
                      r.hidden ? styles.off : styles.on
                    }`}
                    onClick={() => handleToggleHidden(r)}
                  >
                    <div className={styles.toggleCircle} />
                  </div>
                </div>

                {/* BUTTONS */}
                <div className={styles.buttonRow}>
                  
                  {editingId === r.id ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(r)}
                        disabled={savingId === r.id}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditText("");
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(r.id);
                        setEditText(r.comment || "");
                      }}
                    >
                      Edit
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleConsent(r)}
                    disabled={savingId === r.id}
                  >
                    {r.user_consented
                      ? 'Make Anonymous'
                      : 'Show Full Name & Photo'}
                  </button>

                  <button
                    onClick={() => handleDelete(r)}
                    disabled={savingId === r.id}
                  >
                    Delete
                  </button>

                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
