import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';

export default function StripeConnectPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }

      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          router.replace('/login');
          return;
        }

        const u = snap.data();
        if (u?.role !== 'teacher') {
          router.replace('/');
          return;
        }

        // 1) Eğer zaten tamamlanmışsa dashboard'a
        if (u?.stripeOnboarded) {
          router.replace('/teacher/dashboard');
          return;
        }

        // 2) Eğer Stripe account ID varsa önce durumunu kontrol et
        if (u?.stripeAccountId) {
          try {
            const res = await fetch(`/api/check-stripe-status?accountId=${u.stripeAccountId}`);
            const data = await res.json();

            if (data?.details_submitted) {
              await updateDoc(ref, { stripeOnboarded: true });
              router.replace('/teacher/dashboard');
              return;
            }
          } catch (e) {
            // durum kontrolü başarısız olsa da aşağıda yeni link oluşturacağız
          }
        }

        // 3) Her durumda (ID olsa da olmasa da) taze bir onboarding linki yarat
        //    Bu endpoint hesap yoksa oluşturur, varsa yeni bir link döner.
        const linkRes = await fetch(`/api/create-stripe-account-link?uid=${user.uid}`);
        const linkData = await linkRes.json();

        if (!linkRes.ok || !linkData?.url) {
          setMsg('Could not create Stripe onboarding link.');
          setLoading(false);
          return;
        }

        setUrl(linkData.url);
        setLoading(false);
      } catch (e) {
        setMsg('Unexpected error while preparing Stripe onboarding.');
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  return (
    <div style={{ padding: 40, maxWidth: 720, margin: '0 auto' }}>
      <h2>🧾 Connect Your Stripe Account</h2>
      <p>
        To receive payouts for your lessons, you need to complete Stripe onboarding.
        This takes just a couple of minutes.
      </p>

      {loading && <p>Loading Stripe link…</p>}
      {!loading && msg && <p style={{ color: '#b00', fontWeight: 600 }}>❌ {msg}</p>}

      {!loading && url && (
        <a href={url}>
          <button
            style={{
              marginTop: 12,
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #635bff',
              background: '#635bff',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🔗 Connect with Stripe
          </button>
        </a>
      )}

      <div style={{ marginTop: 16, fontSize: 14, color: '#666' }}>
        After finishing Stripe onboarding, you will be redirected back here automatically.
      </div>
    </div>
  );
}
