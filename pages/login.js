import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const role = userSnap.data().role;
        if (role === 'teacher') {
          router.push('/teacher/dashboard');
        } else if (role === 'student') {
          router.push('/student/dashboard');
        } else {
          setError('Tanımsız kullanıcı rolü.');
        }
      } else {
        setError('Kullanıcı Firestore’da bulunamadı.');
      }
    } catch (err) {
      setError('Email veya şifre hatalı.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', paddingTop: 50 }}>
      <h2>Giriş Yap</h2>
      <form onSubmit={handleLogin}>
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required /><br />
        <input name="password" type="password" placeholder="Şifre" value={form.password} onChange={handleChange} required /><br /><br />
        <button type="submit">Giriş Yap</button>
      </form>
      {error && <p style={{ color: 'red' }}>❌ {error}</p>}
    </div>
  );
}
