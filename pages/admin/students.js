'use client';

import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import styles from '../../scss/AdminStudents.module.scss';

function toDate(v) {
  if (!v) return null;
  if (typeof v === 'number') return new Date(v);
  if (v.toDate) return v.toDate();
  return new Date(v);
}

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", "student"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setStudents(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatDate = (v) => {
    const d = toDate(v);
    if (!d || isNaN(d)) return "—";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleDelete = async (s) => {
    if (!confirm(`Delete ${s.name}?`)) return;
    setDeletingId(s.id);

    try {
      const res = await fetch("/api/admin/deleteStudent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: s.id }),
      });

      if (!res.ok) throw new Error("delete failed");

      setStudents(prev => prev.filter(x => x.id !== s.id));
      alert("Deleted.");
    } catch (err) {
      alert("Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const renderArray = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return "—";
    return arr.join(", ");
  };

  return (
    <main className={`container ${styles.page}`}>
      <header className={styles.header}>
        <h1>All Students</h1>
        <p className={styles.sub}>View and manage all registered students.</p>
        <span className={styles.countBadge}>{students.length}</span>
      </header>

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : (
        <div className={styles.grid}>
          {students.map((s) => (
            <article key={s.id} className={styles.card}>
              {/* ========== TOP ========== */}
              <div className={styles.top}>
                <div className={styles.identity}>
                  <div className={styles.avatar}>
                    {s.profilePhotoUrl ? (
                      <Image src={s.profilePhotoUrl} width={56} height={56} alt="profile" />
                    ) : (
                      <div className={styles.avatarFallback}>👤</div>
                    )}
                  </div>

                  <div>
                    <h3>{s.name || "Unnamed"}</h3>
                    <span className={styles.email}>{s.email}</span>
                    <div className={styles.meta}>Joined: {formatDate(s.createdAt)}</div>
                    <div className={styles.meta}>
                        Status: {s.status ? s.status : "active"}
                    </div>
                  </div>
                </div>

                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(s)}
                  disabled={deletingId === s.id}
                >
                  {deletingId === s.id ? "Deleting…" : "🗑 Delete"}
                </button>
              </div>

              {/* ========== BODY ========== */}
              <div className={styles.body}>
                <dl>
                  <dt>City</dt>
                  <dd>{s.city || "—"}</dd>

                  <dt>Country</dt>
                  <dd>{s.country || "—"}</dd>

                  <dt>Date of Birth</dt>
                  <dd>{s.dob || "—"}</dd>

                  <dt>Phone</dt>
                  <dd>{s.phone || "—"}</dd>

                  <dt>Intro</dt>
                  <dd>{s.intro || "—"}</dd>

                  <dt>Level</dt>
                  <dd>{s.level || "—"}</dd>

                  <dt>Profile Views</dt>
                  <dd>{s.viewLimit ?? 0}</dd>

                  <dt>Messages Left</dt>
                  <dd>{s.messagesLeft ?? 0}</dd>

                  {/* ===== Subscription Info ===== */}
                  <dt>Subscription Plan</dt>
                  <dd>{s.subscriptionPlan || "free"}</dd>

                  {s.subscription?.planKey && (
                    <>
                      <dt>Active Until</dt>
                      <dd>{formatDate(s.subscription.activeUntil)}</dd>

                      <dt>Last Payment</dt>
                      <dd>{formatDate(s.subscription.lastPaymentAt)}</dd>

                      <dt>Lifetime Payments</dt>
                      <dd>{s.subscription.lifetimePayments ?? 0}</dd>
                    </>
                  )}

                  {/* ===== Learning Goals ===== */}
                  <dt>Learning Goals</dt>
                  <dd>
                    <strong>Exam:</strong> {renderArray(s.learning_goals?.exam)}<br/>
                    <strong>General:</strong> {renderArray(s.learning_goals?.general)}<br/>
                    <strong>Professional:</strong> {renderArray(s.learning_goals?.professional)}<br/>
                    <strong>Personal:</strong> {renderArray(s.learning_goals?.personal)}<br/>
                    <strong>Digital:</strong> {renderArray(s.learning_goals?.digital)}
                  </dd>

                  {/* ===== Lessons Taken ===== */}
                  <dt>Lessons Taken</dt>
                  <dd>{s.lessonsTaken ?? 0}</dd>

                  {/* ===== Email & Notifications ===== */}
                  <dt>Email Verified</dt>
                  <dd>{s.emailVerified ? "Yes" : "No"}</dd>

                  <dt>Email Notifications</dt>
                  <dd>{s.emailNotifications ? "Enabled" : "Disabled"}</dd>

                  <dt>Parent Consent</dt>
                  <dd>{s.parentConsentRequired ? "Required" : "Not required"}</dd>

                  {/* ===== Stripe ===== */}
                  {s.stripe?.customerId && (
                    <>
                      <dt>Stripe Customer</dt>
                      <dd>{s.stripe.customerId}</dd>
                    </>
                  )}
                </dl>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
