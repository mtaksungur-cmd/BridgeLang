import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function useAuthGuard(expectedRole) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userOk, setUserOk] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      const ref = doc(db, 'users', user.uid); // kullanıcı Firestore'da kayıtlı olmalı
      const snap = await getDoc(ref);
      const data = snap.data();

      if (data?.role !== expectedRole) {
        router.push('/login');
        return;
      }

      setUserOk(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { loading, userOk };
}
