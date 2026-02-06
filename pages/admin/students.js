'use client';

import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import SeoHead from '../../components/SeoHead';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (s) => {
    if (!confirm(`Delete ${s.name}?`)) return;
    setDeletingId(s.id);
    try {
      const res = await fetch('/api/admin/deleteStudent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: s.id }),
      });
      if (!res.ok) throw new Error('delete failed');
      setStudents(prev => prev.filter(x => x.id !== s.id));
      alert('✅ Deleted');
    } catch (err) {
      alert('❌ Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (val) => {
    if (!val) return '—';
    const d = val.toDate ? val.toDate() : new Date(val);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB');
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
      <SeoHead title="Students Administration" description="Manage all students" />
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <header style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              All Students
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <p style={{ fontSize: '0.9375rem', color: '#64748b', margin: 0 }}>
                View and manage registered students
              </p>
              <span style={{
                padding: '0.25rem 0.625rem',
                background: '#dbeafe',
                color: '#1e40af',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {students.length}
              </span>
            </div>
          </header>

          {students.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', margin: 0 }}>No students yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {students.map(s => (
                <div key={s.id} style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    {s.profilePhotoUrl ? (
                      <Image src={s.profilePhotoUrl} alt={s.name} width={56} height={56} style={{ borderRadius: '10px' }} />
                    ) : (
                      <div style={{ width: '56px', height: '56px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        👤
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                        {s.name || 'Unnamed'}
                      </h3>
                      <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 0.25rem 0' }}>{s.email}</p>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                        Joined: {formatDate(s.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '6px', marginBottom: '1rem' }}>
                    <InfoRow label="Plan" value={s.subscriptionPlan || 'free'} />
                    <InfoRow label="City" value={s.city} />
                    <InfoRow label="Messages Left" value={s.messagesLeft ?? 0} />
                    <InfoRow label="Lessons Taken" value={s.lessonsTaken || 0} />
                  </div>

                  <button
                    onClick={() => handleDelete(s)}
                    disabled={deletingId === s.id}
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      background: deletingId === s.id ? '#94a3b8' : 'white',
                      color: deletingId === s.id ? 'white' : '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: deletingId === s.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {deletingId === s.id ? 'Deleting...' : '🗑 Delete Student'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
      <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>{label}:</span>
      <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#0f172a' }}>{value || '—'}</span>
    </div>
  );
}
