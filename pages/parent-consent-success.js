import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Check } from 'lucide-react';
import styles from '../scss/StudentRegister.module.scss';

export default function ParentConsentSuccess() {
  return (
    <>
      <Head>
        <title>Consent confirmed | BridgeLang</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className={styles.registerPage}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
          <Image src="/bridgelang.png" alt="BridgeLang" width={50} height={50} />
        </Link>
        <div className={styles.successCard}>
          <div className={styles.icon}>
            <Check size={40} strokeWidth={2.5} />
          </div>
          <h2>Consent confirmed</h2>
          <p>
            Your child can now use BridgeLang. They can sign in with their account and start learning.
          </p>
          <Link href="/login" className={styles.btnNext} style={{ width: '100%', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
            Go to sign in
          </Link>
        </div>
      </div>
    </>
  );
}
