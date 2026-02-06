import Link from 'next/link';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import UserDropdown from './UserDropdown';
import NotificationCenter from './NotificationCenter';
import styles from './DefaultNavbar.module.scss';

export default function TeacherNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
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
        <Link href="/teacher/dashboard" className={styles.logo}>
          <Image
            src="/bridgelang.png"
            alt="BridgeLang Logo"
            width={40}
            height={40}
          />
          <span className={styles.logoText} style={{ fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif', fontWeight: 700, letterSpacing: '-0.02em' }}>
            BridgeLang
            {user?.subscriptionPlan === 'starter' && <span style={{ color: '#10b981', fontWeight: 800 }}>+</span>}
            {user?.subscriptionPlan === 'pro' && <span style={{ color: '#2563eb', fontWeight: 800, marginLeft: '0.25rem' }}>PRO</span>}
            {user?.subscriptionPlan === 'vip' && <span style={{ color: '#8b5cf6', fontWeight: 800, marginLeft: '0.25rem' }}>VIP</span>}
          </span>
        </Link>

        <button
          className={styles.mobileToggle}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
        </button>

        <ul className={`${styles.menu} ${mobileMenuOpen ? styles.menuOpen : ''}`}>
          <li>
            <Link href="/teacher/dashboard" className={styles.link}>Dashboard</Link>
          </li>
          <li>
            <Link href="/teacher/calendar" className={styles.link}>Calendar</Link>
          </li>
          <li>
            <Link href="/teacher/lessons" className={styles.link}>My Lessons</Link>
          </li>
          <li>
            <Link href="/teacher/chats" className={styles.link}>Chats</Link>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user && <NotificationCenter userId={user.uid} />}
          </li>
          <li style={{ marginLeft: '0.5rem' }}>
            {user && <UserDropdown user={user} />}
          </li>
        </ul>
      </div>
    </nav>
  );
}

