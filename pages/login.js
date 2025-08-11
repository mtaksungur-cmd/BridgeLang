import { useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import styles from '../scss/LoginPage.module.scss';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { user } = await signInWithEmailAndPassword(auth, form.email, form.password);
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists()) return setError('Kullanıcı Firestore’da bulunamadı.');

      const role = snap.data().role;
      if (role === 'teacher') router.push('/teacher/dashboard');
      else if (role === 'student') router.push('/student/dashboard');
      else setError('Tanımsız kullanıcı rolü.');
    } catch (err) {
      setError('Email veya şifre hatalı.');
    }
  };

  return (
    <>
      {/* Navbar burada görünür */}
      <main className={styles.page}>
        <section className={styles.card}>
          <h1 className={styles.title}>Login</h1>

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
              <span>Şifre</span>
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

            {error && <p className={styles.error}>❌ {error}</p>}

            <button type="submit" className={`bg-danger ${styles.submit}`}>Login</button>
          </form>
        </section>
      </main>
    </>
  );
}
