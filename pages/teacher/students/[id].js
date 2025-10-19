'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import styles from '../../../scss/StudentProfileView.module.scss';

export default function StudentProfileView() {
  const router = useRouter();
  const { id } = router.query;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchStudent = async () => {
      try {
        const ref = doc(db, 'users', id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setStudent(snap.data());
        }
      } catch (err) {
        console.error('fetchStudent error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  const calcAge = (dob) => {
    if (!dob) return '—';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  if (loading) return <p className={styles.info}>Loading student profile...</p>;
  if (!student) return <p className={styles.info}>Student not found.</p>;

  // 🔹 Öğrenim hedefleri formatı
  const goals = [];
  if (student.learning_goals && typeof student.learning_goals === 'object') {
    Object.entries(student.learning_goals).forEach(([cat, arr]) => {
      if (arr?.length)
        goals.push(
          `🎯 ${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${arr.join(', ')}`
        );
    });
  }
  if (student.otherGoal) goals.push(`✨ Other: ${student.otherGoal}`);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          ← Back
        </button>

        <div className={styles.header}>
          {student.profilePhotoUrl ? (
            <Image
              src={student.profilePhotoUrl}
              alt="Student"
              width={80}
              height={80}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>👤</div>
          )}

          <div>
            <h1 className={styles.name}>{student.name || 'Unnamed Student'}</h1>
            {student.level && (
              <p className={styles.level}>Level: {student.level}</p>
            )}
          </div>
        </div>

        <div className={styles.infoGrid}>
          <p><strong>Age:</strong> {calcAge(student.dob)}</p>
          <p>
            <strong>Location:</strong>{' '}
            {student.country || '—'}
            {student.city ? ` / ${student.city}` : ''}
          </p>
        </div>

        {goals.length > 0 && (
          <div className={styles.goalsBox}>
            <h3>Learning Goals</h3>
            <ul>
              {goals.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
