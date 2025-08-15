import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth, db } from '../../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import TeacherLayout from '../../components/TeacherLayout';
import styles from '../../scss/TeacherChats.module.scss';

export default function TeacherChats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      // Bu listede her chat dokümanında teacherId alanı olduğunu varsayıyoruz
      const qChats = query(
        collection(db, 'chats'),
        where('teacherId', '==', user.uid)
      );
      const snap = await getDocs(qChats);

      const rows = [];
      for (const chatDoc of snap.docs) {
        const chat = { id: chatDoc.id, ...chatDoc.data() };
        const studentId = chat.studentId;

        // Öğrenci bilgisi
        let student = {};
        if (studentId) {
          const sSnap = await getDoc(doc(db, 'users', studentId));
          if (sSnap.exists()) student = sSnap.data();
        }

        // Son mesaj
        const msgsSnap = await getDocs(
          query(
            collection(db, 'chats', chatDoc.id, 'messages'),
            orderBy('createdAt', 'asc')
          )
        );
        const messages = msgsSnap.docs.map(d => d.data());
        const lastMessage = messages.length ? messages[messages.length - 1] : null;

        // Okunmamış mı? (öğretmen için)
        // readBy alanı yoksa ve son mesaj karşı taraftansa "okunmamış" kabul edilir.
        const unread =
          lastMessage &&
          lastMessage.sender !== user.uid &&
          !Array.isArray(lastMessage.readBy)
            ? true
            : lastMessage &&
              lastMessage.sender !== user.uid &&
              !lastMessage.readBy?.includes(user.uid);

        rows.push({
          chatId: chatDoc.id,
          student,
          lastMessage,
          unread,
        });
      }

      // Son mesaja göre sırala (yeniler üstte)
      rows.sort((a, b) => {
        const at = a.lastMessage?.createdAt?.seconds || 0;
        const bt = b.lastMessage?.createdAt?.seconds || 0;
        return bt - at;
      });

      setChats(rows);
      setLoading(false);
    };

    run();
  }, [router]);

  if (loading) {
    return (
        <div className={styles.container}><p>Loading chats...</p></div>
    );
  }

  if (chats.length === 0) {
    return (
        <div className={styles.container}>
          <h2 className={styles.header}>Your Chats</h2>
          <p>No conversations yet.</p>
        </div>
    );
  }

  const formatTime = (ts) => {
    if (!ts?.seconds) return '';
    return new Date(ts.seconds * 1000).toLocaleString('en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    };

  return (
      <div className={styles.container}>
        <h2 className={styles.header}>Your Chats</h2>
        <ul className={styles.list}>
          {chats.map(({ chatId, student, lastMessage, unread }) => {
            const previewText = lastMessage?.text
              ? lastMessage.text.length > 48
                ? lastMessage.text.slice(0, 45) + '...'
                : lastMessage.text
              : 'No messages yet';

            return (
              <li
                key={chatId}
                className={`${styles.item} ${unread ? styles.unread : ''}`}
                onClick={() => router.push(`/teacher/chats/${chatId}`)}
              >
                {student?.profilePhotoUrl ? (
                  <img
                    className={styles.avatar}
                    src={student.profilePhotoUrl}
                    alt={student?.name || 'Student'}
                  />
                ) : (
                  <div className={styles.avatarFallback}>
                    {(student?.name || 'S')[0]}
                  </div>
                )}

                <div className={styles.info}>
                  <div className={styles.topRow}>
                    <span className={styles.name}>
                      {student?.name || student?.email || 'Unknown Student'}
                    </span>
                    <span className={styles.time}>
                      {formatTime(lastMessage?.createdAt)}
                    </span>
                  </div>
                  <div className={styles.bottomRow}>
                    <span className={styles.preview}>
                      {previewText || <span className={styles.muted}>No messages yet</span>}
                    </span>
                    {unread && <span className={styles.unreadDot} />}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
  );
}
