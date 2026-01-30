'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import styles from './AdminNavbar.module.scss';

export default function AdminNavbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className={styles.bar}>
      <div className="container">
        <div className={styles.row}>

          {/* Brand */}
          <div className={styles.brand}>BridgeLang Admin</div>

          {/* Hamburger button (mobile) */}
          <button
            className={styles.hamburger}
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <span className={open ? styles.lineOpen : styles.line}></span>
            <span className={open ? styles.lineOpen : styles.line}></span>
            <span className={open ? styles.lineOpen : styles.line}></span>
          </button>

          {/* Desktop nav */}
          <nav className={styles.navDesktop}>
            <Link href="/admin/teachers">Teachers</Link>
            <Link href="/admin/students">Students</Link>
            <Link href="/admin/reviews">Reviews</Link>
            <Link href="/admin/reports">Reports</Link>
            <button className={styles.logout} onClick={logout}>Logout</button>
          </nav>
        </div>
      </div>

      {/* Slide-in mobile menu */}
      <div className={`${styles.mobileMenu} ${open ? styles.open : ''}`}>
        <nav className={styles.mobileNav}>
          <Link href="/admin/teachers" onClick={() => setOpen(false)}>Teachers</Link>
          <Link href="/admin/students" onClick={() => setOpen(false)}>Students</Link>
          <Link href="/admin/reviews" onClick={() => setOpen(false)}>Reviews</Link>
          <Link href="/admin/reports" onClick={() => setOpen(false)}>Reports</Link>
          <button onClick={logout} className={styles.logoutMobile}>
            Logout
          </button>
        </nav>
      </div>

      {/* Dark overlay */}
      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}
    </header>
  );
}
