'use client';

import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, updateDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import SeoHead from '../../components/SeoHead';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterHidden, setFilterHidden] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(5);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    const snap = await getDocs(
      query(collection(db, 'reviews'), orderBy('createdAt', 'desc'))
    );
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setReviews(data);
    setFiltered(data);
    setLoading(false);
  };

  useEffect(() => {
    let list = [...reviews];
    if (filterType) list = list.filter(r => r.review_type === filterType);
    if (filterHidden) list = list.filter(r => String(r.hidden) === filterHidden);
    if (filterRating) list = list.filter(r => String(r.rating) === filterRating);
    setFiltered(list);
  }, [filterType, filterHidden, filterRating, reviews]);

  const handleDelete = async (r) => {
    if (!confirm('Delete this review?')) return;
    await deleteDoc(doc(db, 'reviews', r.id));
    setReviews(prev => prev.filter(x => x.id !== r.id));
  };

  const startEdit = (r) => {
    setEditing(r);
    setEditText(r.comment);
    setEditRating(r.rating || 5);
  };

  const saveEdit = async () => {
    const updated = {
      comment: editText,
      rating: editRating,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(doc(db, 'reviews', editing.id), updated);
    setReviews(prev => prev.map(x => (x.id === editing.id ? { ...x, ...updated } : x)));
    setEditing(null);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <SeoHead title="Reviews Administration" description="Manage all reviews" />
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <header style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Reviews Administration
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#64748b', margin: 0 }}>
              View, edit and manage all reviews
            </p>
          </header>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '0.625rem 1rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
                background: 'white'
              }}
            >
              <option value="">All Types</option>
              <option value="teacher_review">Teacher Reviews</option>
              <option value="platform_student">Platform (Student)</option>
              <option value="platform_teacher">Platform (Teacher)</option>
            </select>

            <select
              value={filterHidden}
              onChange={(e) => setFilterHidden(e.target.value)}
              style={{
                padding: '0.625rem 1rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
                background: 'white'
              }}
            >
              <option value="">All Status</option>
              <option value="false">Visible</option>
              <option value="true">Hidden</option>
            </select>

            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              style={{
                padding: '0.625rem 1rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
                background: 'white'
              }}
            >
              <option value="">All Ratings</option>
              {[5, 4, 3, 2, 1].map(n => (
                <option key={n} value={n}>{n} Stars</option>
              ))}
            </select>
          </div>

          {/* Reviews Grid */}
          {filtered.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', margin: 0 }}>No reviews found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {filtered.map(r => (
                <div key={r.id} style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.625rem',
                        background: '#eff6ff',
                        color: '#1e40af',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>
                        {r.review_type}
                      </span>
                      <div style={{ fontSize: '1.125rem', color: '#fbbf24' }}>
                        {'⭐'.repeat(r.rating || 0)}
                      </div>
                    </div>
                    {r.hidden && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: '#fef3c7',
                        color: '#92400e',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        Hidden
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.5', marginBottom: '1rem' }}>
                    {r.comment}
                  </p>

                  <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '1rem' }}>
                    <div><strong>Name:</strong> {r.display_name || 'Anon'}</div>
                    {r.studentId && <div><strong>Student:</strong> {r.studentId.slice(0, 8)}...</div>}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => startEdit(r)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      ✏ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: 'white',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Modal */}
          {editing && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '500px',
                width: '90%'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem' }}>
                  Edit Review
                </h3>

                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows="5"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    marginBottom: '1rem'
                  }}
                />

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                    Rating
                  </label>
                  <select
                    value={editRating}
                    onChange={(e) => setEditRating(Number(e.target.value))}
                    style={{
                      padding: '0.625rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      background: 'white'
                    }}
                  >
                    {[5, 4, 3, 2, 1].map(n => (
                      <option key={n} value={n}>{n} Stars</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => setEditing(null)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'white',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
