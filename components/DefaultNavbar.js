'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import styles from './DefaultNavbar.module.scss';
import Image from "next/image";
import UserDropdown from './UserDropdown';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function DefaultNavbar({ authUser }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeTimeout = useRef(null);

  const open = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setDropdownOpen(true);
  };

  const scheduleClose = (delay = 1000) => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => setDropdownOpen(false), delay);
  };

  const handleMouseEnter = () => open();
  const handleMouseLeave = () => scheduleClose(500);
  const handleToggleClick = () => setDropdownOpen(v => !v);

  useEffect(() => {
    return () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/bridgelang.png"
            alt="BridgeLang Logo"
            width={40}
            height={40}
          />
          <span className={styles.logoText}>BridgeLang<sup className={styles.trademark}>®</sup></span>
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
            <Link href="/how-it-works?role=student" className={styles.link} onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
          </li>
          <li>
            <Link href="/pricing" className={styles.link} onClick={() => setMobileMenuOpen(false)}>Pricing & Plans</Link>
          </li>
          <li>
            <Link href="/student/teachers" className={styles.link} onClick={() => setMobileMenuOpen(false)}>
              Meet Our UK-Based Tutors
            </Link>
          </li>
          <li>
            <Link href="/faq" className={styles.link} onClick={() => setMobileMenuOpen(false)}>FAQ</Link>
          </li>
          <li>
            <Link href="/testimonials/student" className={styles.link} onClick={() => setMobileMenuOpen(false)}>
              What Learners Experience
            </Link>
          </li>

          {!authUser && (
            <li
              className={styles.dropdown}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className={styles.dropdownToggle}
                onClick={handleToggleClick}
                aria-haspopup="true"
                aria-expanded={dropdownOpen ? 'true' : 'false'}
              >
                Sign Up
                <span className={styles.caret}>▾</span>
              </button>

              <ul
                className={`${styles.dropdownMenu} ${dropdownOpen ? styles.show : ''}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <li>
                  <Link className={styles.dropdownItem} href="/student/register" onClick={() => { setMobileMenuOpen(false); setDropdownOpen(false); }}>
                    Join as a Student
                  </Link>
                </li>
                <li>
                  <Link className={styles.dropdownItem} href="/teacher/apply" onClick={() => { setMobileMenuOpen(false); setDropdownOpen(false); }}>
                    Join as a Tutor
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {!authUser && (
            <li>
              <Link href="/login" className={styles.loginBtn}>Login</Link>
            </li>
          )}

          {authUser && (
            <li style={{ marginLeft: '0.5rem' }}>
              <UserDropdown user={authUser} />
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
