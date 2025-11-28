'use client';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { auth } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  reload,
  signInWithCustomToken,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { setPersistence, browserLocalPersistence } from 'firebase/auth';
import styles from '../scss/LoginPage.module.scss';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState('login');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ------------------ 🔹 Şifremi Unuttum ------------------ */
  const handleForgotPassword = async () => {
    setMessage('');
    const email = form.email.trim().toLowerCase();
    if (!email)
      return setMessage('⚠️ Please enter your email before resetting password.');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(
        '📩 Password reset email sent. Please check your Inbox and Spam folder.'
      );
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to send password reset email.');
    }
  };

  /* ------------------ 1️⃣ LOGIN (email + password) ------------------ */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await setPersistence(auth, browserLocalPersistence);
      const email = form.email.trim().toLowerCase();
      const { user } = await signInWithEmailAndPassword(auth, email, form.password);
      await reload(user);

      const res = await fetch('/api/auth/send-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send code');

      // Hesap duraklatılmışsa
      if (data.paused) {
        await signOut(auth);
        setStage('login');
        setMessage('⏸️ Your account is paused. We sent a reactivation link to your email.');
        return;
      }

      // Normal durumda OTP ekranına geç
      await signOut(auth);
      setStage('verify');
      setMessage('✅ A 6-digit code has been sent to your email.');
    } catch (err) {
      console.error(err);
      setMessage('❌ ' + (err.message || 'Login failed.'));
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ 2️⃣ OTP DOĞRULAMA ------------------ */
  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/verify-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          code: otp.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');

      if (data.status === 'paused') {
        await signOut(auth);
        setStage('login');
        setMessage('⏸️ Your account is paused. A reactivation link has been sent to your email.');
        return;
      }

      await signInWithCustomToken(auth, data.token);

      // 🔹 Rol bazlı yönlendirme
      if (data.role === 'teacher') router.push('/teacher/dashboard');
      else if (data.role === 'student') router.push('/student/dashboard');
      else if (data.role === 'admin') router.push('/admin/teachers');
      else router.push('/');

      setMessage('✅ Login successful.');
    } catch (err) {
      console.error(err);
      setMessage('❌ ' + (err.message || 'Verification failed.'));
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ UI ------------------ */
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Login</h1>

        {message && (
          <p
            className={
              message.startsWith('✅')
                ? styles.success
                : message.startsWith('❌')
                ? styles.error
                : styles.info
            }
          >
            {message}
          </p>
        )}

        {/* LOGIN FORM */}
        {stage === 'login' && (
          <form onSubmit={handleLogin} className={styles.form}>
            <label className={styles.label}>
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="example@mail.com"
              />
            </label>

            <label className={styles.label}>
              <span>Password</span>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="••••••••"
              />
            </label>

            <div className={styles.actionsRow}>
              <button
                type="submit"
                disabled={loading}
                className={`bg-danger ${styles.submit}`}
              >
                {loading ? 'Please wait…' : 'Login'}
              </button>

              <button
                type="button"
                className={styles.linkBtn}
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>
          </form>
        )}

        {/* VERIFY FORM */}
        {stage === 'verify' && (
          <form onSubmit={handleVerify} className={styles.form}>
            <label className={styles.label}>
              <span>Verification Code</span>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className={styles.input}
                placeholder="Enter 6-digit code"
                required
              />
            </label>

            <button
              type="submit"
              className={styles.submit}
              disabled={loading || otp.length < 6}
            >
              {loading ? 'Verifying…' : 'Verify & Login'}
            </button>

            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => setStage('login')}
            >
              ← Back to login
            </button>
          </form>
        )}

        {/* ALT BAĞLANTILAR */}
        <div className={styles.hint}>
          New here?{' '}
          <Link href="/student/register" className={styles.inlineLink}>
            Create a student account
          </Link>{' '}
          or{' '}
          <Link href="/teacher/apply" className={styles.inlineLink}>
            apply as a teacher
          </Link>.
        </div>
      </section>
    </main>
  );
}
