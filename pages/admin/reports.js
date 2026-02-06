'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import SeoHead from '../../components/SeoHead';

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);

      if (snap.exists() && snap.data().role === 'admin') {
        setIsAdmin(true);
        fetchReports();
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports');
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const formatDate = (ts) => {
    try {
      const d = ts?.toDate?.() || (ts instanceof Date ? ts : null);
      return d ? d.toLocaleString('en-GB') : '—';
    } catch {
      return '—';
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '3rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>❌</p>
          <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
            You don't have permission to view this page
          </p>
        </div>
      </div>
    );
  }

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
      <SeoHead title="Reports Administration" description="View all complaints" />
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <header style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              🚨 Complaints
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <p style={{ fontSize: '0.9375rem', color: '#64748b', margin: 0 }}>
                All complaints submitted by users
              </p>
              <span style={{
                padding: '0.25rem 0.625rem',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {reports.length}
              </span>
            </div>
          </header>

          {reports.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', margin: 0 }}>No complaints submitted</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {reports.map(r => (
                <div key={r.id} style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                        Complaint from {r.role || 'User'}
                      </h3>
                      <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0 }}>
                        {formatDate(r.createdAt)}
                      </p>
                    </div>
                    <span style={{
                      padding: '0.375rem 0.75rem',
                      background: r.status === 'resolved' ? '#dcfce7' : '#fef3c7',
                      color: r.status === 'resolved' ? '#166534' : '#92400e',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      fontWeight: '600'
                    }}>
                      {r.status || 'open'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>
                    <InfoItem label="Submitted by" value={`${r.userId?.slice(0, 8) || '—'}... (${r.role})`} />
                    <InfoItem label="Teacher" value={r.teacherName || '—'} />
                    <InfoItem label="Student" value={r.studentName || '—'} />
                    <InfoItem label="Booking ID" value={r.bookingId?.slice(0, 8) || '—'} />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>
                      Reason
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                      {r.reason || '—'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>
                      Description
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#475569',
                      background: '#f8fafc',
                      padding: '1rem',
                      borderRadius: '6px',
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.5'
                    }}>
                      {r.description || '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.875rem', color: '#0f172a' }}>
        {value}
      </div>
    </div>
  );
}
