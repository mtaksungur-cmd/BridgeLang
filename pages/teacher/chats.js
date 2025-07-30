import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import TeacherLayout from '../../components/TeacherLayout';
import Link from 'next/link';

export default function TeacherChats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      const user = auth.currentUser;
      if (!user) return;
      // Chat’lerde teacherId alanı olacak şekilde tasarladık!
      const q = query(
        collection(db, 'chats'),
        where('teacherId', '==', user.uid)
      );
      const snap = await getDocs(q);
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchChats();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <TeacherLayout>
      <div style={{ padding: 40 }}>
        <h2>💬 My Chats</h2>
        {chats.length === 0 ? (
          <p>No chats found.</p>
        ) : (
          <ul>
            {chats.map(chat => (
              <li key={chat.id}>
                {/* Her sohbetin öğrenci kimliği ve adı varsa */}
                <Link href={`/teacher/chats/${chat.id}`}>
                  <b>{chat.studentName || chat.studentId}</b> ile sohbet
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </TeacherLayout>
  );
}