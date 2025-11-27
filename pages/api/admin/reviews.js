'use client';

import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from 'firebase/firestore';
import styles from '../../../scss/AdminReviews.module.scss';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterHidden, setFilterHidden] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterName, setFilterName] = useState('');

  const [editing, setEditing] = useState(null); // review obj
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(5);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const snap = await getDocs(
        query(collection(db, 'reviews'), orderBy('createdAt', 'desc'))
      );
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReviews(data);
      setFiltered(data);
      setLoading(false);
    })();
  }, []);

  // Apply filters
  useEffect(() => {
    let list = [...reviews];

    if (filterType) list = list.filter((r) => r.review_type === filterType);
    if (filterHidden) list = list.filter((r) => String(r.hidden) === filterHidden);
    if (filterRating) list = list.filter((r) => String(r.rating) === filterRating);
    if (filterName)
      list = list.filter((r) =>
        (r.display_name || '').toLowerCase().includes(filterName.toLowerCase())
      );

    setFiltered(list);
  }, [filterType, filterHidden, filterRating, filterName, reviews]);

  const handleDelete = async (r) => {
    if (!confirm('Delete this review permanently?')) return;
    await deleteDoc(doc(db, 'reviews', r.id));
    setReviews((prev) => prev.filter((x) => x.id !== r.id));
  };

  const startEdit = (r) => {
    setEditing(r);
    setEditText(r.comment);
    setEditRating(r.rating || 5);
  };

  const saveEdit = async () => {
    const docRef = doc(db, 'reviews', editing.id);

    const updated = {
      comment: editText,
      rating: editRating,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(docRef, updated);

    setReviews((prev) =>
      prev.map((x) => (x.id === editing.id ? { ...x, ...updated } : x))
    );

    setEditing(null);
  };

  return (
    <main className={`container ${styles.page}`}>
      <header className={styles.header}>
        <h1>Reviews Administration</h1>
        <p className={styles.sub}>
          View, filter, edit and delete all reviews submitted by teachers or students.
        </p>
      </header>

      {/* 🔎 FILTERS */}
      <div className={styles.filters}>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="teacher_review">Teacher Reviews</option>
          <option value="platform_student">Platform Reviews (Student)</option>
          <option value="platform_teacher">Platform Reviews (Teacher)</option>
        </select>

        <select value={filterHidden} onChange={(e) => setFilterHidden(e.target.value)}>
          <option value="">Hidden / Visible</option>
          <option value="false">Visible</option>
          <option value="true">Hidden</option>
        </select>

        <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} Stars</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Filter by display name..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading Reviews…</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>No reviews found.</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((r) => (
            <div key={r.id} className={styles.card}>
              <div className={styles.topRow}>
                <span className={styles.type}>{r.review_type}</span>
                <span className={styles.rating}>{'★'.repeat(r.rating || 0)}</span>
              </div>

              <p className={styles.comment}>{r.comment}</p>

              <div className={styles.meta}>
                <span><b>Name:</b> {r.display_name || 'Anon'}</span>
                {r.teacherId && <span><b>Teacher:</b> {r.teacherId}</span>}
                {r.studentId && <span><b>Student:</b> {r.studentId}</span>}
                <span><b>Hidden:</b> {r.hidden ? 'Yes' : 'No'}</span>
                <span><b>Updated:</b> {r.updatedAt?.slice(0, 10) || '—'}</span>
              </div>

              <div className={styles.actions}>
                <button onClick={() => startEdit(r)}>✏ Edit</button>
                <button onClick={() => handleDelete(r)}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🔧 EDIT MODAL */}
      {editing && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Edit Review</h3>

            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className={styles.textarea}
            />

            <label>Rating</label>
            <select value={editRating} onChange={(e) => setEditRating(Number(e.target.value))}>
              {[5,4,3,2,1].map((n)=>(
                <option key={n} value={n}>{n} Stars</option>
              ))}
            </select>

            <div className={styles.modalActions}>
              <button onClick={() => setEditing(null)}>Cancel</button>
              <button onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
