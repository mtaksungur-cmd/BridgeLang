// components/NavbarSwitcher.jsx
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

import DefaultNavbar from './DefaultNavbar';
import StudentNavbar from './StudentNavbar';
import TeacherNavbar from './TeacherNavbar';

export default function NavbarSwitcher() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const r = snap.exists() ? snap.data().role : null;
        setRole(r || null);
      } catch {
        setRole(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  if (loading) return <DefaultNavbar />;        // kısa yükleme anında default göster
  if (!role) return <DefaultNavbar />;          // giriş yoksa veya rol yoksa default
  if (role === 'student') return <StudentNavbar />;
  if (role === 'teacher') return <TeacherNavbar />;
  return <DefaultNavbar />;                     // beklenmedik rol için fallback
}
