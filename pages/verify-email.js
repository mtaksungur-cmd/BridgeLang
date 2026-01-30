// pages/verify-email.js
'use client';
import { useEffect, useState } from 'react';
import { applyActionCode, getAuth } from 'firebase/auth';
import { useRouter } from 'next/router';
import styles from '../scss/VerifyEmail.module.scss';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState('Verifying your email...');
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const oobCode = router.query.oobCode;
    if (!oobCode) return;

    const verifyEmail = async () => {
      try {
        await applyActionCode(auth, oobCode);
        setStatus('✅ Your email has been verified successfully!');
        setTimeout(() => router.push('/login'), 2500);
      } catch (err) {
        console.error('verifyEmail error:', err);
        setStatus('❌ Invalid or expired verification link.');
      }
    };

    verifyEmail();
  }, [router.query]);

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1>Email Verification</h1>
        <p>{status}</p>
      </div>
    </main>
  );
}
