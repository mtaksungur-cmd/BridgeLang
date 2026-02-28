import { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function Cancel() {
  const [dashboardUrl, setDashboardUrl] = useState('/student/dashboard');

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && snap.data().role === 'teacher') {
          setDashboardUrl('/teacher/dashboard');
        }
      } catch (e) { /* ignore */ }
    });
    return () => unsub();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Payment Cancelled ❌</h1>
      <p>Your payment was cancelled. You can try again.</p>
      <Link href={dashboardUrl}>Go to Dashboard</Link>
    </div>
  );
}
