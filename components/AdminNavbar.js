'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { Settings, LogOut } from 'lucide-react';
import UserDropdown from './UserDropdown';
import styles from './DefaultNavbar.module.scss';

export default function AdminNavbar() {
  const router = useRouter();
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

  const handleLogout = async () => {
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
          <span className={`${styles.logoText} ${styles.logoTextDesktop}`}>BridgeLang Admin</span>
          <span className={`${styles.logoText} ${styles.logoTextMobile}`}>Admin</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className={styles.mobileActions}>
            <Link href="/account/settings" className={styles.mobileActionBtn} aria-label="Settings">
              <Settings size={20} />
            </Link>
            <button
              type="button"
              className={styles.mobileLogoutBtn}
              onClick={handleLogout}
              aria-label="Log out"
            >
              <LogOut size={20} />
            </button>
          </div>
          <button
            className={styles.mobileToggle}
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
          >
            <span className={styles.hamburger}></span>
            <span className={styles.hamburger}></span>
            <span className={styles.hamburger}></span>
          </button>
        </div>

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
