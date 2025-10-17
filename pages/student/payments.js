'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import styles from '../../scss/PaymentsPage.module.scss';

export default function PaymentsPage() {
  const [lessons, setLessons] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchPayments = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const q = query(
          collection(db, 'lessons'),
          where('studentId', '==', user.uid),
          where('status', 'in', ['student_approved', 'completed'])
        );

        const snap = await getDocs(q);
        if (snap.empty) {
          setMessage('No completed lessons or payments found.');
          setLessons([]);
          setLoading(false);
          return;
        }

        const list = [];
        let total = 0;

        for (const docSnap of snap.docs) {
          const d = docSnap.data();

          // Öğretmen adını users koleksiyonundan çekelim
          let teacherName = '—';
          try {
            const tSnap = await getDoc(doc(db, 'users', d.teacherId));
            if (tSnap.exists()) teacherName = tSnap.data().name || '—';
          } catch {
            teacherName = '—';
          }

          total += d.amountPaid || 0;

          list.push({
            id: docSnap.id,
            date: d.date,
            startTime: d.startTime,
            duration: d.duration,
            teacherName,
            amountPaid: d.amountPaid || 0,
            discountPercent: d.discountPercent || 0,
            originalPrice: d.originalPrice || 0,
            status: d.status,
          });
        }

        // Tarihe göre sıralama (en yeni yukarıda)
        list.sort((a, b) => (a.date < b.date ? 1 : -1));

        setLessons(list);
        setTotalPaid(total);
      } catch (err) {
        console.error(err);
        setMessage('❌ Failed to load payment history. Please check your Firestore rules.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [router]);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Payment History</h1>

        {loading && <p className={styles.info}>Loading lessons...</p>}
        {message && <p className={styles.info}>{message}</p>}

        {!loading && lessons.length > 0 && (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Teacher</th>
                  <th>Duration (min)</th>
                  <th>Price (£)</th>
                  <th>Discount (%)</th>
                  <th>Paid (£)</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((l) => (
                  <tr key={l.id}>
                    <td>{l.date}</td>
                    <td>{l.startTime}</td>
                    <td>{l.teacherName}</td>
                    <td>{l.duration}</td>
                    <td>{l.originalPrice.toFixed(2)}</td>
                    <td>{l.discountPercent}</td>
                    <td className={styles.success}>{l.amountPaid.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.totalBox}>
              <strong>Total Paid: </strong>
              <span>£{totalPaid.toFixed(2)}</span>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
