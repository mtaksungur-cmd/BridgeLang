'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Settings, LogOut } from 'lucide-react';

export default function AdminPageHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const linkStyle = {
    color: 'rgba(255,255,255,0.9)',
    textDecoration: 'none',
    fontSize: '0.9375rem',
    fontWeight: 500,
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
  };

  const buttonStyle = {
    ...linkStyle,
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  return (
    <>
    <style>{`@media (max-width: 1023px) { .admin-header-actions { display: none !important; } }`}</style>
    <header
      style={{
        background: '#102c57',
        color: 'white',
        padding: '0.75rem 1rem',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
          <Link href="/admin/teachers" style={linkStyle}>Teachers</Link>
          <Link href="/admin/students" style={linkStyle}>Students</Link>
          <Link href="/admin/reviews" style={linkStyle}>Reviews</Link>
          <Link href="/admin/reports" style={linkStyle}>Reports</Link>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="admin-header-actions">
          <Link
            href="/account/settings"
            style={linkStyle}
            title="Settings"
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            style={{ ...buttonStyle, color: '#fca5a5' }}
            title="Log out"
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </header>
    </>
  );
}
