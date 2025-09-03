// components/Footer.js
'use client';
import Link from 'next/link';
import styles from './Footer.module.scss';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          
          {/* Company */}
          <div>
            <h5 className={styles.heading}>Company</h5>
            <ul className={styles.list}>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h5 className={styles.heading}>Support</h5>
            <ul className={styles.list}>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/how-it-works">How it Works</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h5 className={styles.heading}>Legal</h5>
            <ul className={styles.list}>
              <li><Link href="/legal/terms">Terms & Conditions</Link></li>
              <li><Link href="/legal/privacy">Privacy Policy</Link></li>
              <li><Link href="/legal/refund">Refund Policy</Link></li>
              <li><Link href="/legal/cookie">Cookie Policy</Link></li>
              <li><Link href="/legal">More Legal</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottomRow}>
          <small>© {new Date().getFullYear()} BridgeLang UK Ltd. | Company No: 16555217 | Registered in England and Wales</small>
        </div>
      </div>
    </footer>
  );
}
