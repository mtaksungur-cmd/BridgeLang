'use client';

import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import styles from '../../scss/AdminTeachers.module.scss';
import Image from 'next/image';

function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  return new Date(value);
}

export default function AdminTeachers() {
  const [pending, setPending] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  // 🔹 Pending teachers (başvurular)
  useEffect(() => {
    (async () => {
      try {
        setLoadingPending(true);
        const snap = await getDocs(collection(db, 'pendingTeachers'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPending(data);
      } finally {
        setLoadingPending(false);
      }
    })();
  }, []);

  // 🔹 Onaylanmış öğretmenler (users / role=teacher)
  useEffect(() => {
    (async () => {
      try {
        setLoadingTeachers(true);
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'teacher'),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTeachers(data);
      } catch (err) {
        console.error('load teachers error:', err);
      } finally {
        setLoadingTeachers(false);
      }
    })();
  }, []);

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

      // pending listesinden çıkar
      setPending(prev => prev.filter(p => p.id !== app.id));

      // users koleksiyonundan tekrar çek (en temizi)
      const snap = await getDocs(
        query(
          collection(db, 'users'),
          where('role', '==', 'teacher'),
          orderBy('createdAt', 'desc')
        )
      );
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTeachers(data);

      alert(`✅ ${app.name || 'Teacher'} approved.`);
    } catch (err) {
      console.error('Approval error:', err);
      alert('❌ Approval failed.');
    } finally {
      setApprovingId(null);
    }
  };

  const rejectTeacher = async (teacher) => {
    if (!confirm(`Reject application of ${teacher.name || 'this teacher'}?`)) return;
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
      alert(`❌ ${teacher.name || 'Teacher'} application rejected.`);
    } catch (err) {
      console.error('Rejection error:', err);
      alert('❌ Rejection failed.');
    } finally {
      setRejectingId(null);
    }
  };

  const handleDeleteTeacher = async (t) => {
    if (!confirm(`This will permanently delete ${t.name || 'this teacher'} (user + auth). Continue?`)) {
      return;
    }
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      setTeachers(prev => prev.filter(x => x.id !== t.id));
      alert(`🗑️ ${t.name || 'Teacher'} deleted.`);
    } catch (err) {
      console.error('Delete teacher error:', err);
      alert('❌ Failed to delete teacher.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (val) => {
    const d = toDate(val);
    if (!d || isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <main className={`container ${styles.page}`}>
      {/* 🔹 Header */}
      <header className={styles.header}>
        <h1>Teachers Administration</h1>
        <p className={styles.sub}>
          Review pending applications and manage all approved tutors on the platform.
        </p>
      </header>

      {/* =======================
          PENDING APPLICATIONS
         ======================= */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Pending Teacher Applications</h2>
          <span className={styles.countBadge}>{pending.length}</span>
        </div>

        {loadingPending ? (
          <div className={styles.loading}>Loading pending applications…</div>
        ) : pending.length === 0 ? (
          <div className={styles.empty}>No pending applications.</div>
        ) : (
          <div className={styles.grid}>
            {pending.map((app) => (
              <article key={app.id} className={styles.card}>
                <div className={styles.head}>
                  <div className={styles.identity}>
                    {app.profilePhotoUrl ? (
                      <Image
                        src={app.profilePhotoUrl}
                        alt={`${app.name || 'Teacher'} photo`}
                        className={styles.avatar}
                        width={56}
                        height={56}
                      />
                    ) : (
                      <div className={styles.avatarFallback}>👤</div>
                    )}
                    <div>
                      <h3 className={styles.name}>{app.name || 'Unnamed'}</h3>
                      <div className={styles.meta}>
                        <span>{app.email || '—'}</span>
                        {app.city && <span> · {app.city}</span>}
                        {app.postcode && <span> · {app.postcode}</span>}
                      </div>
                      <div className={styles.metaSmall}>
                        <span>Applied: {formatDate(app.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button
                      className={styles.approve}
                      onClick={() => approveTeacher(app)}
                      disabled={approvingId === app.id}
                    >
                      {approvingId === app.id ? 'Approving…' : '✅ Approve'}
                    </button>
                    <button
                      className={styles.reject}
                      onClick={() => rejectTeacher(app)}
                      disabled={rejectingId === app.id}
                    >
                      {rejectingId === app.id ? 'Rejecting…' : '❌ Reject'}
                    </button>
                  </div>
                </div>

                <div className={styles.body}>
                  <div className={styles.col}>
                    <dl className={styles.dl}>
                      <dt>Bio</dt>
                      <dd>{app.bio || '—'}</dd>

                      <dt>Address</dt>
                      <dd>
                        {[app.homeAddress, app.city, app.postcode, app.country]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </dd>

                      <dt>Timezone</dt>
                      <dd>{app.timezone || '—'}</dd>

                      <dt>Languages Taught</dt>
                      <dd>{app.languagesTaught || '—'}</dd>

                      <dt>Languages Spoken</dt>
                      <dd>{app.languagesSpoken || '—'}</dd>
                    </dl>
                  </div>

                  <div className={styles.col}>
                    <dl className={styles.dl}>
                      <dt>Experience (years)</dt>
                      <dd>{app.experienceYears ?? '—'}</dd>

                      <dt>Education</dt>
                      <dd>{app.educationLevel || '—'}</dd>

                      <dt>Specialisations</dt>
                      <dd>{app.teachingSpecializations || '—'}</dd>

                      <dt>Lesson Delivery</dt>
                      <dd>{app.deliveryMethod || '—'}</dd>

                      <dt>Student Ages</dt>
                      <dd>{app.studentAges || '—'}</dd>
                    </dl>
                  </div>

                  <div className={styles.col}>
                    <dl className={styles.dl}>
                      <dt>Pricing</dt>
                      <dd>
                        <div className={styles.priceRow}>
                          <span>30 min</span>
                          <strong>£{app.pricing30 ?? '—'}</strong>
                        </div>
                        <div className={styles.priceRow}>
                          <span>45 min</span>
                          <strong>£{app.pricing45 ?? '—'}</strong>
                        </div>
                        <div className={styles.priceRow}>
                          <span>60 min</span>
                          <strong>£{app.pricing60 ?? '—'}</strong>
                        </div>
                      </dd>

                      <dt>Platform Experience</dt>
                      <dd>{app.platformExperience || '—'}</dd>

                      <dt>Willing to travel</dt>
                      <dd>{app.willingToTravel ? 'Yes' : 'No'}</dd>
                    </dl>
                  </div>

                  <div className={styles.col}>
                    <dl className={styles.dl}>
                      <dt>Certificates</dt>
                      <dd>
                        {app.certificationUrls?.length ? (
                          <ul className={styles.linkList}>
                            {app.certificationUrls.map((url, i) => (
                              <li key={i}>
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                  View Certificate {i + 1}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          'None'
                        )}
                      </dd>

                      <dt>CV</dt>
                      <dd>
                        {app.cvUrl ? (
                          <a href={app.cvUrl} target="_blank" rel="noopener noreferrer">
                            📄 View CV
                          </a>
                        ) : (
                          'Not uploaded'
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
                {/* INTRO VIDEO (NEW, FULL-WIDTH SECTION) */}
                {app.introVideoUrl && (
                  <div className={styles.introVideoSection}>
                    <h3>Intro Video</h3>
                    <div className={styles.videoWrapper}>
                      <video className={styles.video} controls preload="metadata">
                        <source src={app.introVideoUrl} type="video/mp4" />
                      </video>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* =======================
          APPROVED TEACHERS
         ======================= */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Approved Tutors</h2>
          <span className={styles.countBadge}>{teachers.length}</span>
        </div>

        {loadingTeachers ? (
          <div className={styles.loading}>Loading approved teachers…</div>
        ) : teachers.length === 0 ? (
          <div className={styles.empty}>No approved teachers yet.</div>
        ) : (
          <div className={styles.teacherGrid}>
            {teachers.map((t) => {
              const created = formatDate(t.createdAt);
              const approved = formatDate(t.approvedAt);
              const avgRating =
                typeof t.avgRating === 'number'
                  ? t.avgRating.toFixed(1)
                  : '—';

              return (
                <article key={t.id} className={styles.teacherCard}>
                  <div className={styles.teacherTop}>
                    <div className={styles.identity}>
                      {t.profilePhotoUrl ? (
                        <Image
                          src={t.profilePhotoUrl}
                          alt={`${t.name || 'Teacher'} photo`}
                          className={styles.avatar}
                          width={56}
                          height={56}
                        />
                      ) : (
                        <div className={styles.avatarFallback}>👤</div>
                      )}
                      <div>
                        <h3 className={styles.name}>{t.name || 'Unnamed'}</h3>
                        <div className={styles.meta}>
                          <span>{t.email || '—'}</span>
                          {t.city && <span> · {t.city}</span>}
                          {t.postcode && <span> · {t.postcode}</span>}
                        </div>
                        <div className={styles.metaSmall}>
                          <span>Status: {t.status || '—'}</span>
                          <span> · Joined: {created}</span>
                          {approved !== '—' && <span> · Approved: {approved}</span>}
                        </div>
                      </div>
                    </div>

                    <div className={styles.teacherActions}>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteTeacher(t)}
                        disabled={deletingId === t.id}
                      >
                        {deletingId === t.id ? 'Deleting…' : '🗑 Delete'}
                      </button>
                    </div>
                  </div>

                  
                  {/* 🟦 BIO TEK SATIR – TAM GENİŞLİK */}
                  <div className={styles.bioBlock}>
                    <h3>Bio</h3>
                    <p>{t.bio || '—'}</p>
                  </div>

                  {/* 🟩 ALTTAKİ 3 KOLON GRID */}
                  <div className={styles.bodyGrid}>
                    {/* Column 1 */}
                    <div className={styles.col}>
                      <dl className={styles.dl}>
                        <dt>Languages Taught</dt><dd>{t.languagesTaught}</dd>
                        <dt>Languages Spoken</dt><dd>{t.languagesSpoken}</dd>
                        <dt>Experience (years)</dt><dd>{t.experienceYears}</dd>
                        <dt>Education</dt><dd>{t.educationLevel}</dd>
                        <dt>Student Ages</dt><dd>{t.studentAges}</dd>
                        <dt>Lesson Delivery</dt><dd>{t.deliveryMethod}</dd>
                        <dt>Willing to travel</dt><dd>{t.willingToTravel ? 'Yes' : 'No'}</dd>
                      </dl>
                    </div>

                    {/* Column 2 */}
                    <div className={styles.col}>
                      <dl className={styles.dl}>
                        <dt>Specialisations</dt>
                        <dd>{t.teachingSpecializations || '—'}</dd>
                        <dt>Address</dt>
                        <dd>{t.homeAddress}, {t.city}, {t.postcode}</dd>
                        <dt>Certificates</dt>
                        <dd>
                          {t.certificationUrls?.length
                            ? t.certificationUrls.map((u,i)=>(<div key={i}><a href={u} target="_blank">View Certificate {i+1}</a></div>))
                            : 'None'}
                        </dd>
                        <dt>CV</dt>
                        <dd>{t.cvUrl ? <a href={t.cvUrl} target="_blank">📄 View CV</a> : 'Not uploaded'}</dd>
                      </dl>
                    </div>

                    {/* Column 3 */}
                    <div className={styles.col}>
                      <dl className={styles.dl}>
                        <dt>Pricing</dt>
                        <dd>
                          <div className={styles.priceRow}><span>30 min</span><strong>£{t.pricing30}</strong></div>
                          <div className={styles.priceRow}><span>45 min</span><strong>£{t.pricing45}</strong></div>
                          <div className={styles.priceRow}><span>60 min</span><strong>£{t.pricing60}</strong></div>
                        </dd>

                        <dt>Performance</dt>
                        <dd>
                          Avg rating: {t.avgRating || 0}<br/>
                          Total lessons: {t.totalLessons || 0}<br/>
                          Total earnings: £{t.totalEarnings || 0}<br/>
                          Repeat rate: {t.repeatRate || 0}%
                        </dd>

                        <dt>Badges</dt>
                        <dd>
                          {t.badges?.length
                            ? t.badges.map((b,i)=><span key={i} className={styles.badge}>{b}</span>)
                            : 'No badges'}
                        </dd>
                      </dl>
                    </div>
                  </div>

                  <div className={styles.teacherFooter}>
                    <dl className={styles.dlInline}>
                      <dt>CV</dt>
                      <dd>
                        {t.cvUrl ? (
                          <a href={t.cvUrl} target="_blank" rel="noopener noreferrer">
                            📄 View CV
                          </a>
                        ) : (
                          'Not uploaded'
                        )}
                      </dd>

                      <dt>Certificates</dt>
                      <dd>
                        {t.certificationUrls?.length ? (
                          <span>{t.certificationUrls.length} file(s)</span>
                        ) : (
                          'None'
                        )}
                      </dd>

                      <dt>Intro Video</dt>
                      <dd>{t.introVideoUrl ? 'Uploaded' : 'Not uploaded'}</dd>
                    </dl>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
