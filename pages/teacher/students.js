'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/router';
import styles from '../../scss/TeacherStudents.module.scss';

export default function TeacherStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStudents = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const snap = await getDocs(q);
        const list = snap.docs.map((doc) => {
          const data = doc.data();

          const calcAge = (dob) => {
            if (!dob) return '—';
            const birth = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
            return age;
          };

          // 🔹 goal formatlama
          const goals = [];
          if (data.learning_goals && typeof data.learning_goals === 'object') {
            Object.entries(data.learning_goals).forEach(([cat, arr]) => {
              if (arr?.length)
                goals.push(`${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${arr.join(', ')}`);
            });
          }
          if (data.otherGoal) goals.push(`Other: ${data.otherGoal}`);

          return {
            id: doc.id,
            name: data.name || '—',
            age: calcAge(data.dob),
            location: `${data.country || '—'}${data.city ? '/' + data.city : ''}`,
            goals: goals.join(' • '),
          };
        });
        setStudents(list);
      } catch (err) {
        console.error('fetchStudents error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [router]);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Students Overview</h1>

        {loading ? (
          <p className={styles.info}>Loading students...</p>
        ) : students.length === 0 ? (
          <p className={styles.info}>No students found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Location</th>
                <th>Learning Goals</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.age}</td>
                  <td>{s.location}</td>
                  <td>{s.goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
