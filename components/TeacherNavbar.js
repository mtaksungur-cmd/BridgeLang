import Link from 'next/link';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import Image from 'next/image';
import { useState } from 'react';
import styles from './DefaultNavbar.module.scss';

export default function TeacherNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    signOut(auth).then(() => {
      window.location.href = '/login';
    });
  };

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
          <span className={styles.logoText}>BridgeLang</span>
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
          <li>
            <Link href="/account/security" className={styles.link}>Security Settings</Link>
          </li>
          <li>
            <Link href="/review/platform" className={styles.link}>Share Your Platform Experience</Link>
          </li>
          <li>
            <Link href="/account/reviews" className={styles.link}>My Reviews</Link>
          </li>
          <li>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
