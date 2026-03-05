'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  signInWithCustomToken,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
} from 'firebase/auth';
import { getErrorMessage, getErrorCode } from '../utils/firebaseErrors';

import OTPInput from '../components/OTPInput';

async function getUserFromServer(user) {
  const idToken = await user.getIdToken();
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'server-error');
  return data; // { uid, role, status }
}

function redirectByRole(role, router) {
  if (role === 'teacher') router.push('/teacher/dashboard');
  else if (role === 'student') router.push('/student/dashboard');
  else if (role === 'admin') router.push('/admin/teachers');
  else if (role === 'pending_teacher') router.push('/teacher/pending-approval');
  else router.push('/');
}

async function safeSignOut() {
  try {
    if (auth?.currentUser) await signOut(auth);
  } catch (_) {}
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState('login');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  // Prevents onAuthStateChanged from redirecting mid-login
  const loginInProgressRef = useRef(false);

  useEffect(() => {
    if (!auth) {
      setCheckingAuth(false);
      return;
    }
    let cancelled = false;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;
      if (loginInProgressRef.current) {
        setCheckingAuth(false);
        return;
      }
      if (user) {
        try {
          const { role, status } = await getUserFromServer(user);
          if (cancelled || loginInProgressRef.current) return;
          if (status === 'paused') {
            await safeSignOut();
            setCheckingAuth(false);
            return;
          }
          redirectByRole(role, router);
        } catch (err) {
          console.error('Error fetching user role on auth change:', err);
          if (!cancelled) setCheckingAuth(false);
        }
      } else {
        setCheckingAuth(false);
      }
    });

    return () => { cancelled = true; unsub(); };
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleForgotPassword = async () => {
    setMessage('');
    const email = form.email.trim().toLowerCase();
    if (!email) return setMessage('⚠️ Please enter your email address to reset your password.');

    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
      setMessage('📩 Password reset link has been sent to your email. Please check your inbox and spam folder.');
    } catch (err) {
      console.error(err);
      setMessage('❌ ' + (err.message || 'Failed to send reset email'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    loginInProgressRef.current = true;

    try {
      await setPersistence(auth, browserLocalPersistence);
      const email = form.email.trim().toLowerCase();
      const { user } = await signInWithEmailAndPassword(auth, email, form.password);

      // Get user role/status from server first (needed for admin OTP check)
      const { role, status } = await getUserFromServer(user);

      if (status === 'paused') {
        await safeSignOut();
        loginInProgressRef.current = false;
        setStage('login');
        setMessage('⏸️ Your account is paused. Please contact support.');
        return;
      }

      if (status === 'pending_consent') {
        await safeSignOut();
        loginInProgressRef.current = false;
        setStage('login');
        setMessage('⏳ Your account is awaiting parental consent. A confirmation link has been sent to your parent/guardian\'s email. You can log in once they approve.');
        return;
      }

      if (role === 'pending_teacher') {
        await safeSignOut();
        loginInProgressRef.current = false;
        router.push('/teacher/pending-approval');
        return;
      }

      // Admin accounts ALWAYS require OTP for security
      const isAdmin = role === 'admin';

      // Check global OTP setting for non-admin users
      let otpEnabled = isAdmin;
      if (!isAdmin) {
        try {
          const settingsRes = await fetch('/api/admin/settings/auth');
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            otpEnabled = settingsData.otpEnabled || false;
          }
        } catch (e) {
          console.warn('Failed to fetch auth settings, defaulting OTP to disabled:', e);
        }
      }

      if (!otpEnabled) {
        loginInProgressRef.current = false;
        redirectByRole(role, router);
        return;
      }

      // OTP path: send verification code
      const res = await fetch('/api/auth/send-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errCode = data.error || 'send-code-failed';

        await safeSignOut();
        loginInProgressRef.current = false;

        if (errCode === 'email-send-failed') {
          setMessage('❌ Verification email could not be sent. Please try again or contact support at contact@bridgelang.co.uk');
          return;
        }
        if (errCode === 'server-config-error') {
          setMessage('❌ Server configuration error. Please contact support at contact@bridgelang.co.uk');
          return;
        }

        throw new Error(errCode);
      }

      if (data.paused) {
        await safeSignOut();
        loginInProgressRef.current = false;
        setStage('login');
        setMessage('⏸️ Your account is paused. A reactivation link has been sent to your email.');
        return;
      }

      await safeSignOut();
      loginInProgressRef.current = false;
      setStage('verify');
      setMessage('✅ A 6-digit verification code has been sent to your email.');
    } catch (err) {
      console.error(err);
      // Always sign out on error — prevents limbo state where auth succeeded but flow failed
      await safeSignOut();
      loginInProgressRef.current = false;
      setMessage('❌ ' + getErrorMessage(getErrorCode(err)));
    } finally {
      setLoading(false);
    }
  };

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

      if (!res.ok) {
        const errorMsg = data.error || 'Verification failed';
        throw new Error(errorMsg);
      }

      if (data.status === 'paused') {
        setStage('login');
        setMessage('⏸️ Your account is paused. A reactivation link has been sent to your email.');
        return;
      }

      await signInWithCustomToken(auth, data.token);
      redirectByRole(data.role, router);
    } catch (err) {
      console.error(err);
      setMessage('❌ ' + getErrorMessage(getErrorCode(err)));
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem 2rem'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <Image src="/bridgelang.png" alt="BridgeLang" width={40} height={40} />
            <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>BridgeLang</span>
          </Link>
        </div>
      </header>

      <div style={{ flex: '1', background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
                {stage === 'login' ? 'Welcome Back' : 'Verify Your Email'}
              </h1>
              <p style={{ fontSize: '0.9375rem', color: '#64748b' }}>
                {stage === 'login' ? 'Sign in to your account' : 'Enter the code sent to your email'}
              </p>
            </div>

            {message && (
              <div style={{
                padding: '0.875rem 1rem',
                marginBottom: '1.5rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                ...(message.startsWith('✅') ? { background: '#dcfce7', border: '1px solid #86efac', color: '#166534' } :
                  message.startsWith('❌') ? { background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b' } :
                    message.startsWith('📩') || message.startsWith('⏸️') ? { background: '#dbeafe', border: '1px solid #93c5fd', color: '#1e40af' } :
                      { background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' })
              }}>
                {message}
              </div>
            )}

            {stage === 'login' && (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="example@email.com"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 0.875rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.9375rem',
                      color: '#0f172a',
                      background: 'white',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 0.875rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.9375rem',
                      color: '#0f172a',
                      background: 'white',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '48px',
                    background: loading ? '#94a3b8' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: '0.5rem',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => { if (!loading) e.target.style.background = '#2563eb'; }}
                  onMouseLeave={(e) => { if (!loading) e.target.style.background = '#3b82f6'; }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#3b82f6',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    padding: '0.5rem',
                    fontWeight: '500'
                  }}
                >
                  Forgot Password?
                </button>
              </form>
            )}

            {stage === 'verify' && (
              <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '1rem', textAlign: 'center' }}>
                    Enter Verification Code
                  </label>
                  <OTPInput
                    value={otp}
                    onChange={setOtp}
                    onComplete={(code) => {
                      setOtp(code);
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  style={{
                    width: '100%',
                    height: '48px',
                    background: (loading || otp.length < 6) ? '#94a3b8' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontWeight: '600',
                    cursor: (loading || otp.length < 6) ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => { if (!loading && otp.length >= 6) e.target.style.background = '#2563eb'; }}
                  onMouseLeave={(e) => { if (!loading && otp.length >= 6) e.target.style.background = '#3b82f6'; }}
                >
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStage('login'); setOtp(''); setMessage(''); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    padding: '0.5rem',
                    fontWeight: '500'
                  }}
                >
                  ← Back to login
                </button>
              </form>
            )}

            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
              Don't have an account?{' '}
              <Link href="/student/register" style={{ color: '#3b82f6', fontWeight: '500', textDecoration: 'none' }}>
                Create student account
              </Link>
              {' '}or{' '}
              <Link href="/teacher/apply" style={{ color: '#3b82f6', fontWeight: '500', textDecoration: 'none' }}>
                apply as teacher
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
