'use client';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import styles from '../../scss/AdminTeachers.module.scss';
import Image from "next/image";

export default function AdminTeachers() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'pendingTeachers'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setApplications(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const approveTeacher = async (app) => {
    try {
      await setDoc(
        doc(db, 'users', app.id),
        {
          ...app,
          role: 'teacher',
          status: 'approved',
          emailVerified: true,
        },
        { merge: true }
      );
      await deleteDoc(doc(db, 'pendingTeachers', app.id));
      setApplications(prev => prev.filter(a => a.id !== app.id));
      alert(`✅ ${app.name || 'Teacher'} approved.`);
    } catch (err) {
      console.error('Approval error:', err);
      alert('❌ Approval failed.');
    }
  };

  const rejectTeacher = async (id) => {
    if (!confirm('Are you sure you want to reject this application?')) return;
    try {
      await deleteDoc(doc(db, 'pendingTeachers', id));
      setApplications(prev => prev.filter(a => a.id !== id));
      alert('Application rejected.');
    } catch (err) {
      console.error('Rejection error:', err);
      alert('❌ Rejection failed.');
    }
  };

  return (
    <main className={`container ${styles.page}`}>
      <header className={styles.header}>
        <h1>Pending Teacher Applications</h1>
        <p className={styles.sub}>
          Review, approve, or reject teacher applications submitted to the platform.
        </p>
      </header>

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : applications.length === 0 ? (
        <div className={styles.empty}>No pending applications.</div>
      ) : (
        <div className={styles.grid}>
          {applications.map(app => (
            <article key={app.id} className={styles.card}>
              <div className={styles.head}>
                <div className={styles.identity}>
                  {app.profilePhotoUrl ? (
                    <Image
                      src={app.profilePhotoUrl}
                      alt={`${app.name || 'Teacher'} photo`}
                      className={styles.avatar}
                      width={64}
                      height={64}
                    />
                  ) : (
                    <div className={styles.avatarFallback}>👤</div>
                  )}
                  <div>
                    <h2 className={styles.name}>{app.name || 'Unnamed'}</h2>
                    <div className={styles.meta}>
                      <span>{app.email || '—'}</span>
                      {app.city && <span> · {app.city}</span>}
                      {app.postcode && <span> · {app.postcode}</span>}
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button className={styles.approve} onClick={() => approveTeacher(app)}>
                    ✅ Approve
                  </button>
                  <button className={styles.reject} onClick={() => rejectTeacher(app.id)}>
                    ❌ Reject
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
                      {[app.homeAddress, app.city, app.postcode].filter(Boolean).join(', ') || '—'}
                    </dd>

                    <dt>Timezone</dt>
                    <dd>{app.timezone || '—'}</dd>

                    <dt>Languages Taught</dt>
                    <dd>{app.languagesTaught || '—'}</dd>

                    <dt>Languages Spoken</dt>
                    <dd>{app.languagesSpoken || '—'}</dd>

                    <dt>Experience (years)</dt>
                    <dd>{app.experienceYears ?? '—'}</dd>

                    <dt>Education Level</dt>
                    <dd>{app.educationLevel || '—'}</dd>
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
                          📄 View CV (PDF)
                        </a>
                      ) : (
                        'Not uploaded'
                      )}
                    </dd>

                    <dt>Intro Video</dt>
                    <dd>
                      {app.introVideoUrl ? (
                        <video className={styles.video} controls>
                          <source src={app.introVideoUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        'Not uploaded'
                      )}
                    </dd>

                    <dt>Lesson Types</dt>
                    <dd>{app.lessonTypes || '—'}</dd>

                    <dt>Student Ages</dt>
                    <dd>{app.studentAges || '—'}</dd>

                    <dt>Availability</dt>
                    <dd>{app.availability || '—'}</dd>

                    <dt>Pricing</dt>
                    <dd>
                      <div className={styles.priceRow}><span>30 min</span><strong>£{app.pricing30 ?? '—'}</strong></div>
                      <div className={styles.priceRow}><span>45 min</span><strong>£{app.pricing45 ?? '—'}</strong></div>
                      <div className={styles.priceRow}><span>60 min</span><strong>£{app.pricing60 ?? '—'}</strong></div>
                    </dd>

                    <dt>Platform Experience</dt>
                    <dd>{app.platformExperience || '—'}</dd>

                    <dt>Delivery Method</dt>
                    <dd>{app.deliveryMethod || '—'}</dd>

                    <dt>Willing to travel</dt>
                    <dd>{app.willingToTravel ? 'Yes' : 'No'}</dd>
                  </dl>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
