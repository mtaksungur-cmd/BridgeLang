'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Image from 'next/image';
import styles from './DefaultNavbar.module.scss';

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
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/admin/teachers" className={styles.logo}>
          <Image
            src="/bridgelang.png"
            alt="BridgeLang Logo"
            width={40}
            height={40}
          />
          <span className={styles.logoText}>BridgeLang Admin</span>
        </Link>

        <button
          className={styles.mobileToggle}
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
        </button>

        <ul className={`${styles.menu} ${open ? styles.menuOpen : ''}`}>
          <li>
            <Link href="/admin/teachers" className={styles.link}>Teachers</Link>
          </li>
          <li>
            <Link href="/admin/students" className={styles.link}>Students</Link>
          </li>
          <li>
            <Link href="/admin/reviews" className={styles.link}>Reviews</Link>
          </li>
          <li>
            <Link href="/admin/reports" className={styles.link}>Reports</Link>
          </li>
          <li style={{ marginLeft: 'auto' }}>
            <button
              onClick={logout}
              className={styles.logoutBtn}
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
