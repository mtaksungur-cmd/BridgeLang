'use client';
import Link from 'next/link';
import styles from './Footer.module.scss';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div>
            <h5 className={styles.heading}>Company</h5>
            <ul className={styles.list}>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h5 className={styles.heading}>Support</h5>
            <ul className={styles.list}>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/how-it-works">How It Works</Link></li>
            </ul>
          </div>

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

          <div>
            <h5 className={styles.heading}>Follow Us</h5>
            <div className={styles.socials}>
              <a href="https://www.instagram.com/bridgelang_uk?igsh=a3U0czIyODJ1cDNy" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="https://www.linkedin.com/company/bridgelang-uk/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <i className="bi bi-linkedin"></i>
              </a>
              <a href="https://www.facebook.com/share/17858srkmF/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="https://youtube.com/@bridgelang_uk?si=tA-V6RyZftqOvtRc" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <i className="bi bi-youtube"></i>
              </a>
            </div>
          </div>
        </div>

        <div className={styles.divider}></div>

        <div className={styles.bottom}>
          <div className={styles.companyInfo}>
            <strong>BridgeLang Ltd.</strong> | Company No: 16555217<br />
            The Apex, Derriford Business Park, Brest Road, Plymouth, PL6 5FL, United Kingdom<br />
            📧 <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>
          </div>
          <div className={styles.copyright}>
            © {new Date().getFullYear()} BridgeLang Ltd. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
