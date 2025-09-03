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
  const [role, setRole] = useState(null);      // 'student' | 'teacher' | 'admin' | null
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const isAdminRoute = router.pathname.startsWith('/admin');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setRole(null);
          return;
        }
        const snap = await getDoc(doc(db, 'users', user.uid));
        setRole(snap.exists() ? snap.data().role || null : null);
      } catch {
        setRole(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Admin sayfalarında default navbar istemiyoruz:
  if (isAdminRoute) {
    // auth/role daha yüklenmediyse kısa bir boş header göstermek istersen:
    if (loading) return <div style={{height:48}} />;
    return role === 'admin' ? <AdminNavbar /> : null; // admin değilse hiç navbar gösterme
  }

  // Normal site
  if (loading) return <DefaultNavbar />;
  if (!role) return <DefaultNavbar />;
  if (role === 'student') return <StudentNavbar />;
  if (role === 'teacher') return <TeacherNavbar />;
  if (role === 'admin') return <AdminNavbar />; // admin login olup normal route'a gelirse
  return <DefaultNavbar />;
}
