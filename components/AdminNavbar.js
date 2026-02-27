'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import UserDropdown from './UserDropdown';
import styles from './DefaultNavbar.module.scss';

export default function AdminNavbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: authUser.uid, ...userDoc.data() });
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

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
          <li>
            <Link href="/account/settings" className={styles.link}>Settings</Link>
          </li>
          <li style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            {user && <UserDropdown user={user} />}
          </li>
        </ul>
      </div>
    </nav>
  );
}
