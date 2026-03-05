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
import AdminPageHeader from './AdminPageHeader';

export default function NavbarSwitcher() {
  const [role, setRole] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const isAdminRoute = router.pathname.startsWith('/admin');

  // Hide navbar on auth pages (they have custom headers)
  const authPages = ['/login', '/student/register', '/teacher/apply', '/teacher/register'];
  const isAuthPage = authPages.includes(router.pathname);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        setAuthUser(null);
        setLoading(false);
        return;
      }
      setAuthUser(user);

      const loadRole = async (tries = 3) => {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            setRole(snap.data().role || null);
          } else if (tries > 0) {
            setTimeout(() => loadRole(tries - 1), 500);
            return;
          } else {
            // User not in 'users' — check if they're a pending teacher
            const pendingSnap = await getDoc(doc(db, 'pendingTeachers', user.uid));
            if (pendingSnap.exists()) {
              // Pending teacher: silently show DefaultNavbar, no error log
              setRole(null);
            } else {
              console.error('NavbarSwitcher: user not found in users or pendingTeachers');
              setRole(null);
            }
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

  // Don't render navbar on auth pages
  if (isAuthPage) return null;

  if (isAdminRoute) {
    if (loading) return <div style={{ height: 48 }} />;
    return role === 'admin' ? <AdminPageHeader /> : null;
  }

  if (loading) return <DefaultNavbar />;
  if (!role) return <DefaultNavbar authUser={authUser} />;
  if (role === 'student') return <StudentNavbar />;
  if (role === 'teacher') return <TeacherNavbar />;
  if (role === 'admin') return <AdminPageHeader />;
  return <DefaultNavbar authUser={authUser} />;
}
