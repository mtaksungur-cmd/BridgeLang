'use client';

import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import SeoHead from '../../components/SeoHead';

export default function AdminTeachers() {
  const [pending, setPending] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const pendingSnap = await getDocs(collection(db, 'pendingTeachers'));
      setPending(pendingSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const teachersSnap = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'teacher'), orderBy('createdAt', 'desc'))
      );
      setTeachers(teachersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const approveTeacher = async (app) => {
    if (!confirm(`Approve ${app.name || 'this teacher'}?`)) return;
    setApprovingId(app.id);
    try {
      const res = await fetch('/api/admin/approveTeacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher: app }),
      });
      if (!res.ok) throw new Error('API error');
      await loadData();
      alert(`✅ ${app.name} approved!`);
    } catch (err) {
      console.error(err);
      alert('❌ Approval failed');
    } finally {
      setApprovingId(null);
    }
  };

  const rejectTeacher = async (teacher) => {
    if (!confirm(`Reject ${teacher.name}?`)) return;
    setRejectingId(teacher.id);
    try {
      const res = await fetch('/api/admin/rejectTeacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher.id,
          teacherEmail: teacher.email,
          teacherName: teacher.name,
        }),
      });
      if (!res.ok) throw new Error('API error');
      setPending(prev => prev.filter(a => a.id !== teacher.id));
      alert(`❌ ${teacher.name} rejected`);
    } catch (err) {
      console.error(err);
      alert('❌ Rejection failed');
    } finally {
      setRejectingId(null);
    }
  };

  const deleteTeacher = async (t) => {
    if (!confirm(`DELETE ${t.name} permanently?`)) return;
    setDeletingId(t.id);
    try {
      const res = await fetch('/api/admin/deleteTeacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: t.id,
          teacherEmail: t.email,
          teacherName: t.name,
        }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setTeachers(prev => prev.filter(x => x.id !== t.id));
      alert(`🗑️ ${t.name} deleted`);
    } catch (err) {
      console.error(err);
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
      <SeoHead title="Teachers Administration" description="Manage teacher applications and approved tutors" />
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <header style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Teachers Administration
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#64748b', margin: 0 }}>
              Review pending applications and manage approved tutors
            </p>
          </header>

          {/* Pending Applications */}
          <section style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Pending Applications
              </h2>
              <span style={{
                padding: '0.25rem 0.625rem',
                background: '#fef3c7',
                color: '#92400e',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {pending.length}
              </span>
            </div>

            {pending.length === 0 ? (
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: '#94a3b8', margin: 0 }}>No pending applications</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {pending.map(app => (
                  <div key={app.id} style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {app.profilePhotoUrl ? (
                          <Image src={app.profilePhotoUrl} alt={app.name} width={60} height={60} style={{ borderRadius: '10px' }} />
                        ) : (
                          <div style={{ width: '60px', height: '60px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                            👤
                          </div>
                        )}
                        <div>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                            {app.name || 'Unnamed'}
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.25rem 0' }}>{app.email}</p>
                          <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0 }}>
                            Applied: {formatDate(app.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          onClick={() => approveTeacher(app)}
                          disabled={approvingId === app.id}
                          style={{
                            padding: '0.625rem 1.25rem',
                            background: approvingId === app.id ? '#94a3b8' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: approvingId === app.id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {approvingId === app.id ? 'Approving...' : '✅ Approve'}
                        </button>
                        <button
                          onClick={() => rejectTeacher(app)}
                          disabled={rejectingId === app.id}
                          style={{
                            padding: '0.625rem 1.25rem',
                            background: rejectingId === app.id ? '#94a3b8' : '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: rejectingId === app.id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {rejectingId === app.id ? 'Rejecting...' : '❌ Reject'}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                      <InfoItem label="Bio" value={app.bio} />
                      <InfoItem label="City" value={app.city} />
                      <InfoItem label="Experience" value={`${app.experienceYears || 0} years`} />
                      <InfoItem label="Languages Taught" value={app.languagesTaught} />
                      <InfoItem label="Pricing 30 min" value={`£${app.pricing30}`} />
                      <InfoItem label="Pricing 60 min" value={`£${app.pricing60}`} />
                    </div>

                    {app.introVideoUrl && (
                      <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                        <h4 style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#0f172a', margin: '0 0 0.75rem 0' }}>
                          Intro Video
                        </h4>
                        <video controls style={{ width: '100%', maxWidth: '600px', borderRadius: '8px' }}>
                          <source src={app.introVideoUrl} type="video/mp4" />
                        </video>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Approved Teachers */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Approved Tutors
              </h2>
              <span style={{
                padding: '0.25rem 0.625rem',
                background: '#dcfce7',
                color: '#166534',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {teachers.length}
              </span>
            </div>

            {teachers.length === 0 ? (
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: '#94a3b8', margin: 0 }}>No approved teachers yet</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {teachers.map(t => (
                  <div key={t.id} style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      {t.profilePhotoUrl ? (
                        <Image src={t.profilePhotoUrl} alt={t.name} width={56} height={56} style={{ borderRadius: '10px' }} />
                      ) : (
                        <div style={{ width: '56px', height: '56px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                          👤
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                          {t.name}
                        </h3>
                        <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 0.25rem 0' }}>{t.email}</p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                          Joined: {formatDate(t.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>
                      <InfoRow label="City" value={t.city} />
                      <InfoRow label="Experience" value={`${t.experienceYears || 0} years`} />
                      <InfoRow label="Total Lessons" value={t.totalLessons || 0} />
                      <InfoRow label="Avg Rating" value={t.avgRating ? `${t.avgRating.toFixed(1)} ⭐` : '—'} />
                    </div>

                    <button
                      onClick={() => deleteTeacher(t)}
                      disabled={deletingId === t.id}
                      style={{
                        width: '100%',
                        padding: '0.625rem',
                        background: deletingId === t.id ? '#94a3b8' : 'white',
                        color: deletingId === t.id ? 'white' : '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: deletingId === t.id ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {deletingId === t.id ? 'Deleting...' : '🗑 Delete Teacher'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.875rem', color: '#0f172a' }}>
        {value || '—'}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>{label}:</span>
      <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#0f172a' }}>{value}</span>
    </div>
  );
}
