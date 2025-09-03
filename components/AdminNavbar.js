// components/AdminNavbar.jsx
'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import styles from './AdminNavbar.module.scss';

export default function AdminNavbar() {
  const router = useRouter();

  const logout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className={styles.bar} role="banner">
      <div className="container">
        <div className={styles.row}>
          <div className={styles.brand}>BridgeLang Admin</div>
          <nav className={styles.nav} aria-label="Admin">
            <Link href="/admin/teachers">Teachers</Link>
            <Link href="/admin/reports">Reports</Link>
            <button className={styles.logout} onClick={logout}>Logout</button>
          </nav>
        </div>
      </div>
    </header>
  );
}
