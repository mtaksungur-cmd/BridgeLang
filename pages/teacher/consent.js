import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function ConsentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.uid);

      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = snap.data();

      if (data.role !== 'teacher') {
        router.push('/student/dashboard');
        return;
      }

      if (data.consent === true) {
        router.push('/teacher/profile');
        return;
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAccept = async () => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        consent: true
      });
      router.push('/teacher/profile');
    } catch (err) {
      setError('Bir hata oluştu.');
    }
  };

  if (loading) return <p>Yükleniyor...</p>;

  return (
    <div style={{ maxWidth: 600, margin: 'auto', paddingTop: 50 }}>
      <h2>🎓 Öğretmen Muvafakatnamesi</h2>
      <p>
        Bu platformda ders vermek için, kullanıcılarımızla platform dışı iletişim kurmayacağınızı ve 
        öğrencilerin iletişim bilgilerini paylaşmayacağınızı taahhüt etmeniz gerekmektedir.
      </p>
      <p>
        Ayrıca, platformun hizmet koşullarını ve ödeme sistemini kabul ettiğinizi onaylamış olursunuz.
      </p>
      <button onClick={handleAccept}>Kabul Ediyorum</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
