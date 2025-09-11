'use client';
import { useEffect, useState } from 'react';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import styles from '../../scss/AdminReports.module.scss';

function formatDate(ts) {
  try {
    const d = ts?.toDate?.() || (ts instanceof Date ? ts : null);
    return d ? d.toLocaleString('en-GB', { hour12: false }) : '—';
  } catch {
    return '—';
  }
}

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
  
      // 🔹 Firestore'dan role çek
      const snap = await getDocs(collection(db, 'complaints'));
      const data = snap.data();
  
      if (data?.role === "admin") {
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
      console.error("Failed to fetch reports:", err);
    }
    setLoading(false);
  };

  if (!isAdmin) {
    return <p className={styles.denied}>❌ You don’t have permission to view this page.</p>;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>🚨 Complaints</h1>
        <p className={styles.sub}>All complaints submitted by students or teachers.</p>
      </header>

      {loading ? (
        <p className={styles.loading}>Loading…</p>
      ) : reports.length === 0 ? (
        <div className={styles.empty}><p>No complaints submitted.</p></div>
      ) : (
        <ul className={styles.list}>
          {reports.map((r) => {
            const statusKey = String(r.status || 'open').toLowerCase();

            return (
              <li key={r.id} className={styles.card}>
                <div className={styles.row}>
                  <div className={styles.kv}>
                    <span className={styles.k}>Submitted by</span>
                    <span className={styles.v}>
                      {r.userId || '—'} ({r.role || '—'})
                    </span>
                  </div>

                  <div className={styles.kv}>
                    <span className={styles.k}>Teacher</span>
                    <span className={styles.v}>{r.teacherId || '—'}</span>
                  </div>

                  <div className={styles.kv}>
                    <span className={styles.k}>Student</span>
                    <span className={styles.v}>{r.studentId || '—'}</span>
                  </div>

                  <div className={styles.kv}>
                    <span className={styles.k}>Booking ID</span>
                    <span className={styles.v}>{r.bookingId || '—'}</span>
                  </div>

                  <div className={styles.kv}>
                    <span className={styles.k}>Created</span>
                    <span className={styles.v}>{formatDate(r.createdAt)}</span>
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.kvWide}>
                    <span className={styles.k}>Reason</span>
                    <span className={styles.v}>{r.reason || '—'}</span>
                  </div>

                  <div className={styles.kvWide}>
                    <span className={styles.k}>Complaint Status</span>
                    <span className={`${styles.badge} ${styles[`status--${statusKey}`]}`}>
                      {r.status || 'open'}
                    </span>
                  </div>
                </div>

                <div className={styles.block}>
                  <span className={styles.kBlock}>Description</span>
                  <pre className={styles.desc}>{r.description || '—'}</pre>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
