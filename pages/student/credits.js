import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import StudentLayout from '../../components/StudentLayout';

export default function StudentCredits() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [buyCount, setBuyCount] = useState(1); // Satın alınacak kredi sayısı
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
        window.location.href = data.url; // Direkt Stripe Checkout'a yönlendir
      } else {
        setMsg(data.error || 'Payment initiation failed');
      }
    } catch (err) {
      setMsg('Payment initiation failed.');
    }
  };

  if (loading) return <StudentLayout><p>Loading...</p></StudentLayout>;
  if (!user) return <StudentLayout><p>User not found.</p></StudentLayout>;

  return (
    <StudentLayout>
      <div style={{ maxWidth: 450, margin: '40px auto', padding: 30, border: "1px solid #eee", borderRadius: 16, background: "#fafcff" }}>
        <h2>🎫 Lesson Credits</h2>
        <p><strong>Current Plan:</strong> {user.subscriptionPlan ? user.subscriptionPlan.toUpperCase() : 'None'}</p>
        <p><strong>Remaining Credits:</strong> <span style={{ fontSize: 26 }}>{user.credits || 0}</span></p>

        <div style={{ marginTop: 30 }}>
          <h4>Buy Extra Credits</h4>
          <div>
            <input
              type="number"
              min="1"
              value={buyCount}
              onChange={e => setBuyCount(Number(e.target.value))}
              style={{ width: 60, marginRight: 8 }}
            />
            <span> x £15 = <strong>£{buyCount * 15}</strong></span>
          </div>
          <button onClick={handleBuyCredits} style={{ marginTop: 12 }}>
            Purchase Credits
          </button>
          {msg && <p style={{ color: 'red', marginTop: 8 }}>{msg}</p>}
        </div>

        {/* Satın alma geçmişi: İsteğe bağlı, bonus ve kredi geçmişini ekleyebilirsin */}
        {/* <div style={{ marginTop: 30 }}>
          <h4>Credit Purchase History</h4>
          <ul>
            <li>01.07.2025 – +3 credits (subscription)</li>
            <li>15.07.2025 – +1 credit (purchase)</li>
          </ul>
        </div> */}
      </div>
    </StudentLayout>
  );
}