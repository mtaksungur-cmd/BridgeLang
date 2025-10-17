// pages/login.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from "next/link";
import { auth, db } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  reload,
  RecaptchaVerifier,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import styles from '../scss/LoginPage.module.scss';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  // 🔐 MFA state
  const [mfaResolver, setMfaResolver] = useState(null);
  const [verificationId, setVerificationId] = useState('');
  const [code, setCode] = useState('');

  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setInfo('');
  };

  const handleForgotPassword = async () => {
    setError(''); setInfo('');
    const email = form.email.trim().toLowerCase();
    if (!email) return setError('Please enter your email, then click "Forgot password".');
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo('Password reset email sent. Please check your Inbox and Spam/Junk folders.');
    } catch (err) {
      setError(err?.message || 'Could not send reset email.');
    }
  };

  const resendVerification = async () => {
    setError(''); setInfo('');
    try {
      const email = form.email.trim().toLowerCase();
      const pwd = form.password;
      if (!email || !pwd) {
        return setError('Enter your email & password, then click "Resend verification".');
      }
      const { user } = await signInWithEmailAndPassword(auth, email, pwd);
      await sendEmailVerification(user);
      await signOut(auth);
      setInfo('Verification email re-sent. Please check Inbox and Spam/Junk.');
    } catch (err) {
      setError(err?.message || 'Could not resend verification email.');
    }
  };

  // 🔁 başarılı oturum sonrası ortak yönlendirme + kontroller
  const afterSignIn = async (user) => {
    // Auth flag'ini güncel gör
    await reload(user);
    const authVerified = !!auth.currentUser?.emailVerified;

    // Kullanıcı doc’unu oku
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await signOut(auth);
      setError('User not found in database.');
      setLoading(false);
      return;
    }
    const u = snap.data();
    const role = u.role;

    // 🔒 Doğrulama mantığı:
    // - student → e-posta doğrulaması ZORUNLU
    // - teacher/admin → doğrulama ZORUNLU DEĞİL
    if (role === 'student') {
      if (authVerified && !u.emailVerified) {
        try { await updateDoc(userRef, { emailVerified: true }); } catch {}
      }
      if (!authVerified) {
        await sendEmailVerification(user);
        await signOut(auth);
        setNeedsVerification(true);
        setInfo('We sent you a verification email. Please verify your address to log in. Check Spam/Junk.');
        setLoading(false);
        return;
      }
    } else {
      if (!u.emailVerified) {
        try { await updateDoc(userRef, { emailVerified: true }); } catch {}
      }
    }

    // Role’e göre yönlendir
    if (role === 'teacher') {
      router.push('/teacher/dashboard');
    } else if (role === 'student') {
      router.push('/student/dashboard');
    } else if (role === 'admin') {
      router.push('/admin/teachers');
    } else {
      await signOut(auth);
      setError('Undefined user role.');
    }
  };

  // 1) Normal giriş denemesi — MFA gerekiyorsa resolver döner
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    setNeedsVerification(false);
    setLoading(true);

    try {
      const email = form.email.trim().toLowerCase();
      const { user } = await signInWithEmailAndPassword(auth, email, form.password);
      // MFA gerekmiyorsa direkt devam
      await afterSignIn(user);
    } catch (err) {
      // MFA gerekli ise: auth/multi-factor-auth-required
      if (err?.code === 'auth/multi-factor-auth-required' && err.resolver) {
        try {
          const resolver = err.resolver;
          setMfaResolver(resolver);

          // Kullanıcının enrolled telefon(lar)ı
          const phoneHint = resolver.hints && resolver.hints[0];
          if (!phoneHint?.phoneNumber) {
            setError('No phone number is enrolled for this account.');
            setLoading(false);
            return;
          }

          // reCAPTCHA (invisible). Bazı SDK sürümlerinde argüman sırası önemli.
          const recaptcha = new RecaptchaVerifier('recaptcha-login', { size: 'invisible' }, auth);
          await recaptcha.render();

          const provider = new PhoneAuthProvider(auth);
          const verificationIdLocal = await provider.verifyPhoneNumber(
            { phoneNumber: phoneHint.phoneNumber, session: resolver.session },
            recaptcha
          );
          setVerificationId(verificationIdLocal);
          setInfo(`📲 Verification code sent to ${phoneHint.phoneNumber}`);
        } catch (sendErr) {
          console.error(sendErr);
          setError('Failed to send SMS. Check phone or recaptcha.');
        } finally {
          setLoading(false);
        }
      } else {
        const code = err?.code || '';
        const map = {
          'auth/invalid-email': 'Invalid email address.',
          'auth/missing-password': 'Password is missing.',
          'auth/invalid-credential': 'Email or password is incorrect.',
          'auth/user-disabled': 'This account has been disabled.',
          'auth/too-many-requests': 'Too many attempts. Try again later.',
        };
        setError(map[code] || 'Email or password is incorrect.');
        setLoading(false);
      }
    }
  };

  // 2) Kullanıcı SMS kodunu girdikten sonra girişin tamamlanması
  const handleConfirmCode = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');

    if (!mfaResolver || !verificationId || !code) {
      setError('Missing verification info.');
      return;
    }
    try {
      const cred = PhoneAuthProvider.credential(verificationId, code);
      const assertion = PhoneMultiFactorGenerator.assertion(cred);
      const userCredential = await mfaResolver.resolveSignIn(assertion);
      setMfaResolver(null);
      setVerificationId('');
      setCode('');
      setInfo('✅ Signed in with 2FA');

      await afterSignIn(userCredential.user);
    } catch (err) {
      console.error(err);
      setError('Invalid code or resolver failed.');
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Login</h1>

        {info && <p className={styles.info}>ℹ️ {info}</p>}
        {error && <p className={styles.error}>❌ {error}</p>}

        {needsVerification && (
          <div className={styles.verifyBox}>
            <p>
              Your email is not verified yet. We’ve sent you a verification email.
              Please click the link inside that email to continue. (Also check Spam/Junk.)
            </p>
            <button type="button" onClick={resendVerification} className={styles.secondaryBtn}>
              Resend verification
            </button>
          </div>
        )}

        {/* MFA gerekmiyorsa normal form; MFA tetiklendiğinde kod formu gösterilir */}
        {!mfaResolver ? (
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

            {/* reCAPTCHA container (invisible) */}
            <div id="recaptcha-login" />

            <div className={styles.actionsRow}>
              <button type="submit" disabled={loading} className={`bg-danger ${styles.submit}`}>
                {loading ? 'Please wait…' : 'Login'}
              </button>

              <button type="button" className={styles.linkBtn} onClick={handleForgotPassword}>
                Forgot password?
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleConfirmCode} className={styles.form}>
            <label className={styles.label}>
              <span>SMS code</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className={styles.input}
                placeholder="6-digit code"
              />
            </label>
            <button type="submit" className={styles.submit}>Confirm code</button>
          </form>
        )}

        <div className={styles.hint}>
          New here?{" "}
          <Link href="/student/register" className={styles.inlineLink}>
            Create a student account
          </Link>{" "}
          or{" "}
          <Link href="/teacher/apply" className={styles.inlineLink}>
            apply as a teacher
          </Link>.
        </div>
      </section>
    </main>
  );
}
