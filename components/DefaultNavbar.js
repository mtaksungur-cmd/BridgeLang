'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import styles from './DefaultNavbar.module.scss';
import Image from "next/image";

export default function DefaultNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
  const handleMouseLeave = () => scheduleClose(500); // 0.5 sn sonra kapanır

  // Mobil: tıkla–aç/kapa
  const handleToggleClick = () => setDropdownOpen(v => !v);

  // Temizlik
  useEffect(() => {
    return () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, []);

  return (
    <nav className="navbar navbar-expand-lg bg-primary">
      <div className="container">
        {/* Logo */}
        <Link href="/" className="navbar-brand d-flex align-items-center">
          <Image 
            src="/bridgelang.png" 
            alt="BridgeLang Logo" 
            width={50} 
            height={50} 
            className="me-2"
          />
          <span style={{ color: 'white', fontWeight: 'bold' }}>BridgeLang</span>
        </Link>

        {/* Hamburger */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#defaultNavbar"
          aria-controls="defaultNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
        </button>

        {/* Menu */}
        <div className="collapse navbar-collapse" id="defaultNavbar">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
            <li className="nav-item">
              <Link href="/how-it-works" className="nav-link text-light">How It Works</Link>
            </li>

            {/* ✅ Teachers link — herkese açık */}
            <li className="nav-item">
              <Link href="/student/teachers" className="nav-link text-light">
                Our ESL Teachers
              </Link>
            </li>

            {/* ✅ FAQ Link */}
            <li className="nav-item">
              <Link href="/faq" className="nav-link text-light">FAQ</Link>
            </li>

            {/* Sign Up (hover + click) */}
            <li
              className={`nav-item position-relative ${styles.dropdown}`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className={`nav-link text-light ${styles.toggleBtn}`}
                aria-haspopup="true"
                aria-expanded={dropdownOpen ? 'true' : 'false'}
                onClick={handleToggleClick} // mobil
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
                  <Link className={styles.dropdownItem} href="/student/register">
                    Student Sign Up
                  </Link>
                </li>
                <li>
                  <Link className={styles.dropdownItem} href="/teacher/apply">
                    Teacher Sign Up
                  </Link>
                </li>
              </ul>
            </li>

            <li className="nav-item">
              <Link href="/login" className="nav-link text-light">Login</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
