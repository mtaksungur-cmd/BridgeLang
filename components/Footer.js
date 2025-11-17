'use client';
import Link from 'next/link';
import { FaWhatsapp } from 'react-icons/fa';
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
              <li><Link href="/how-it-works">How It Works</Link></li>
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
              <li><Link href="/legal">Legal Hub</Link></li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h5 className={styles.heading}>Follow Us</h5>
            <div className={styles.socials}>
              <a href="https://www.instagram.com/bridgelang_uk?igsh=a3U0czIyODJ1cDNy" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="https://www.linkedin.com/company/bridgelang-uk/" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-linkedin"></i>
              </a>
              <a href="https://www.facebook.com/share/17858srkmF/" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-facebook"></i>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bilgileri */}
        <div className={styles.bottomRow}>
          <small>
            <strong>BridgeLang Ltd.</strong> | Company No: 16555217<br />
            The Apex, Derriford Business Park, Brest Road, Plymouth, PL6 5FL, United Kingdom<br />
            📧 <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>
          </small>
          <div className={styles.copyright}>
            © {new Date().getFullYear()} BridgeLang Ltd. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
