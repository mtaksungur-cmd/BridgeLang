'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Settings, LogOut } from 'lucide-react';

/** Sayfa içinde her zaman görünen Settings + Log Out bar */
export default function AdminBar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <Link
        href="/account/settings"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: '#f1f5f9',
          color: '#475569',
          borderRadius: '8px',
          fontSize: '0.9375rem',
          fontWeight: 600,
          textDecoration: 'none',
          border: '1px solid #e2e8f0',
        }}
      >
        <Settings size={18} />
        Settings
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: '#dc2626',
          color: 'white',
          borderRadius: '8px',
          fontSize: '0.9375rem',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <LogOut size={18} />
        Log Out
      </button>
    </div>
  );
}
