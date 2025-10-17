'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/router';
import styles from '../../scss/PaymentsPage.module.scss';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
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
        // Firestore'dan bu öğrenciye ait ödemeleri çek
        const q = query(collection(db, 'payments'), where('userId', '==', user.uid));
        const snap = await getDocs(q);

        if (snap.empty) {
          setMessage('No payment history found.');
          setPayments([]);
        } else {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          // Tarihe göre sıralayalım (yeniden eskiye)
          list.sort((a, b) => b.createdAt - a.createdAt);
          setPayments(list);
        }
      } catch (err) {
        console.error(err);
        setMessage('Failed to load payment history.');
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

        {loading && <p className={styles.info}>Loading your payments…</p>}
        {message && <p className={styles.info}>{message}</p>}

        {!loading && payments.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Plan</th>
                <th>Amount (£)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td>{p.plan || '—'}</td>
                  <td>{p.amount || '—'}</td>
                  <td
                    className={
                      p.status === 'succeeded'
                        ? styles.success
                        : p.status === 'failed'
                        ? styles.failed
                        : styles.pending
                    }
                  >
                    {p.status || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
