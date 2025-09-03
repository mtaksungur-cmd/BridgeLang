'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { defaultState, hasConsent, saveConsent } from '../lib/cookieConsent';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hasConsent()) setShow(true);
  }, []);

  if (!show) return null;

  const acceptAll = () => {
    saveConsent({ ...defaultState, functional: true, analytics: true, advertising: true });
    setShow(false);
  };
  const rejectAll = () => {
    saveConsent({ ...defaultState, functional: false, analytics: false, advertising: false });
    setShow(false);
  };

  return (
    <div style={{
      position: 'fixed', insetInline: 16, bottom: 16, zIndex: 2000,
      background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 16,
      boxShadow: '0 10px 25px rgba(0,0,0,.15)', maxWidth: 720, marginInline: 'auto'
    }}>
      <p style={{margin: 0}}>
        We use cookies to improve your experience, analyze traffic, and personalize content.&nbsp;
        <Link href="/legal/cookie">Learn more</Link>.
      </p>
      <div style={{display:'flex', gap:8, marginTop:12, flexWrap:'wrap'}}>
        <button className="btn btn-primary" onClick={acceptAll}>Accept All</button>
        <button className="btn btn-outline-secondary" onClick={rejectAll}>Reject All</button>
        <Link href="/cookie-preferences" className="btn btn-outline-dark">Manage Settings</Link>
      </div>
    </div>
  );
}
