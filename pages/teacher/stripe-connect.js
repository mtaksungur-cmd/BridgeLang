import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';

export default function StripeConnectPage() {
  const [url, setUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push('/login');

      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      const userData = snap.data();

      if (userData?.role !== 'teacher') return router.push('/');
      if (!userData?.stripeAccountId) return; // güvenlik

      // 🔍 Stripe hesabı gerçekten tamamlandı mı?
      const res = await fetch(`/api/check-stripe-status?accountId=${userData.stripeAccountId}`);
      const data = await res.json();

      if (data.details_submitted) {
        await updateDoc(ref, { stripeOnboarded: true });
        return router.push('/teacher/dashboard');
      }

      // Stripe link oluştur
      const linkRes = await fetch(`/api/create-stripe-account-link?uid=${user.uid}`);
      const linkData = await linkRes.json();
      setUrl(linkData.url);
    });

    return () => unsub();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h2>🧾 Connect Your Stripe Account</h2>
      <p>To receive payments from students, you must connect your Stripe account.</p>
      {url ? (
        <a href={url}>
          <button>🔗 Connect with Stripe</button>
        </a>
      ) : (
        <p>Loading Stripe link...</p>
      )}
    </div>
  );
}
