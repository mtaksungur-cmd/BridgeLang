import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import StudentLayout from '../../components/StudentLayout';
import styles from '../../scss/StudentCredits.module.scss';

const UNIT_PRICE = 15; // £

export default function StudentCredits() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [buyCount, setBuyCount] = useState(1);
  const [msg, setMsg] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const u = auth.currentUser;
      if (!u) return;
      const snap = await getDoc(doc(db, 'users', u.uid));
      if (snap.exists()) setUser({ ...snap.data(), uid: u.uid });
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleBuyCredits = async () => {
    setMsg('Redirecting to payment...');
    setCheckoutUrl('');
    try {
      const res = await fetch('/api/purchase-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          credits: buyCount,
        }),
      });
      const data = await res.json();
      if (data.url) {
        setMsg('');
        setCheckoutUrl(data.url);
        window.location.href = data.url;
      } else {
        setMsg(data.error || 'Payment initiation failed');
      }
    } catch {
      setMsg('Payment initiation failed.');
    }
  };

  if (loading) return <StudentLayout><p className={styles.loading}>Loading...</p></StudentLayout>;
  if (!user)   return <StudentLayout><p className={styles.loading}>User not found.</p></StudentLayout>;

  return (
    <StudentLayout>
      <div className={styles.container}>
        <h2 className={styles.title}>🎫 Lesson Credits</h2>

        <p className={styles.plan}>
          <strong>Current Plan:</strong> {user.subscriptionPlan ? user.subscriptionPlan.toUpperCase() : 'None'}
        </p>

        <p className={styles.remaining}>
          <strong>Remaining Credits:</strong> <span className={styles.remainingCount}>{user.credits || 0}</span>
        </p>

        <div className={styles.buySection}>
          <h4 className={styles.subtitle}>Buy Extra Credits</h4>

          <div className={styles.qtyRow}>
            <input
              type="number"
              min="1"
              value={buyCount}
              onChange={e => setBuyCount(Math.max(1, Number(e.target.value)))}
              className={styles.qtyInput}
            />
            <span className={styles.total}>
              × £{UNIT_PRICE} = <strong>£{buyCount * UNIT_PRICE}</strong>
            </span>
          </div>

          <button onClick={handleBuyCredits} className={styles.buyBtn}>
            Purchase Credits
          </button>

          {msg && <p className={styles.msg}>{msg}</p>}
        </div>

        {/* 
        <div className={styles.history}>
          <h4 className={styles.subtitle}>Credit Purchase History</h4>
          <ul className={styles.historyList}>
            <li>01.07.2025 – +3 credits (subscription)</li>
            <li>15.07.2025 – +1 credit (purchase)</li>
          </ul>
        </div>
        */}
      </div>
    </StudentLayout>
  );
}
