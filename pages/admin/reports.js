// pages/admin/reports.js
'use client';
import { useEffect, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
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
  const [users, setUsers] = useState({});
  const [teachers, setTeachers] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      // ✅ Buraya senin admin UID’ni koy
      if (user.uid === "ADMIN_UIDIN_BURAYA") {
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

    // 1) Şikâyetleri çek
    const snap = await getDocs(collection(db, 'complaints'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 2) ID’leri topla
    const userIds = new Set();
    const teacherIds = new Set();

    for (const r of list) {
      if (r.userId) userIds.add(r.userId);

      if (r.bookingId) {
        try {
          const bSnap = await getDoc(doc(db, 'bookings', r.bookingId));
          if (bSnap.exists()) {
            const b = bSnap.data();

            if (!r.teacherId && b.teacherId) r.teacherId = b.teacherId;
            if (!r.studentId && b.studentId) r.studentId = b.studentId;

            if (b.teacherId) teacherIds.add(b.teacherId);
            if (b.studentId) userIds.add(b.studentId);
          }
        } catch (e) {
          console.error('Booking fetch failed for complaint:', r.id, e);
        }
      } else {
        if (r.teacherId) teacherIds.add(r.teacherId);
        if (r.studentId) userIds.add(r.studentId);
      }
    }

    // 3) Kullanıcı ve öğretmen bilgilerini çek
    const [userMap, teacherMap] = await Promise.all([
      (async () => {
        const map = {};
        await Promise.all(
          Array.from(userIds).map(async (uid) => {
            const s = await getDoc(doc(db, 'users', uid));
            if (s.exists()) map[uid] = s.data();
          })
        );
        return map;
      })(),
      (async () => {
        const map = {};
        await Promise.all(
          Array.from(teacherIds).map(async (tid) => {
            const s = await getDoc(doc(db, 'users', tid));
            if (s.exists()) map[tid] = s.data();
          })
        );
        return map;
      })(),
    ]);

    setUsers(userMap);
    setTeachers(teacherMap);
    setReports(list);
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
            const submittedBy = users[r.userId] || {};
            const teacher = r.teacherId ? (teachers[r.teacherId] || {}) : {};
            const student = r.studentId ? (users[r.studentId] || {}) : {};
            const statusKey = String(r.status || 'open').toLowerCase();

            return (
              <li key={r.id} className={styles.card}>
                <div className={styles.row}>
                  <div className={styles.kv}>
                    <span className={styles.k}>Submitted by</span>
                    <span className={styles.v}>
                      {submittedBy.name ? `${submittedBy.name} ` : ''}
                      <span className={styles.muted}>({r.userId || '—'})</span>
                      {r.role ? <span className={styles.badgeRole}>{r.role}</span> : null}
                    </span>
                  </div>

                  <div className={styles.kv}>
                    <span className={styles.k}>Teacher</span>
                    <span className={styles.v}>
                      {teacher.name ? `${teacher.name} ` : ''}
                      <span className={styles.muted}>({r.teacherId || '—'})</span>
                    </span>
                  </div>

                  <div className={styles.kv}>
                    <span className={styles.k}>Student</span>
                    <span className={styles.v}>
                      {student.name ? `${student.name} ` : ''}
                      <span className={styles.muted}>({r.studentId || '—'})</span>
                    </span>
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
