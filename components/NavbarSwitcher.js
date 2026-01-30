// components/NavbarSwitcher.jsx
'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useRouter } from 'next/router';

import DefaultNavbar from './DefaultNavbar';
import StudentNavbar from './StudentNavbar';
import TeacherNavbar from './TeacherNavbar';
import AdminNavbar from './AdminNavbar';

export default function NavbarSwitcher() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const isAdminRoute = router.pathname.startsWith('/admin');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      const loadRole = async (tries = 3) => {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            setRole(snap.data().role || null);
          } else if (tries > 0) {
            setTimeout(() => loadRole(tries - 1), 500);
            return;
          } else {
            setRole(null);
          }
        } catch (e) {
          console.error('NavbarSwitcher error:', e);
          setRole(null);
        } finally {
          setLoading(false);
        }
      };

      await loadRole();
    });
    return () => unsub();
  }, []);

  if (isAdminRoute) {
    if (loading) return <div style={{ height: 48 }} />;
    return role === 'admin' ? <AdminNavbar /> : null;
  }

  if (loading) return <DefaultNavbar />;
  if (!role) return <DefaultNavbar />;
  if (role === 'student') return <StudentNavbar />;
  if (role === 'teacher') return <TeacherNavbar />;
  if (role === 'admin') return <AdminNavbar />;
  return <DefaultNavbar />;
}
