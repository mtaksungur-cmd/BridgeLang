import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { collection, getDocs, doc, getDoc, query } from "firebase/firestore";
import styles from "../../scss/StudentChats.module.scss";

export default function StudentChatsPage() {
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (usr) => {
      if (!usr) return router.push("/login");
      setUser(usr);

      const chatsSnap = await getDocs(collection(db, "chats"));
      const myChats = [];
      for (let chatDoc of chatsSnap.docs) {
        if (!chatDoc.id.startsWith(usr.uid + "_")) continue;

        const messagesSnap = await getDocs(
          query(collection(db, "chats", chatDoc.id, "messages"))
        );
        const messages = messagesSnap.docs.map(d => d.data());
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

        const [, teacherId] = chatDoc.id.split("_");
        const teacherSnap = await getDoc(doc(db, "users", teacherId));
        const teacher = teacherSnap.exists() ? teacherSnap.data() : {};

        myChats.push({
          chatId: chatDoc.id,
          teacher,
          lastMessage,
        });
      }

      myChats.sort((a, b) =>
        (b.lastMessage?.createdAt?.seconds || 0) - (a.lastMessage?.createdAt?.seconds || 0)
      );

      setChats(myChats);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div>
        <p className={styles.loading}>Loading chats...</p>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div>
        <div className={styles.container}>
          <h2 className={styles.title}>Your Chats</h2>
          <p className={styles.noChats}>No conversations yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.container}>
        <h2 className={styles.title}>Your Chats</h2>
        <ul className={styles.chatList}>
          {chats.map(({ chatId, teacher, lastMessage }) => (
            <li
              key={chatId}
              className={styles.chatItem}
              onClick={() => router.push(`/student/chats/${chatId}`)}
            >
              {teacher.profilePhotoUrl && (
                <img
                  src={teacher.profilePhotoUrl}
                  alt="Teacher"
                  className={styles.chatAvatar}
                />
              )}
              <div className={styles.chatInfo}>
                <div className={styles.chatName}>
                  {teacher.name || "Unknown Teacher"}
                </div>
                <div className={styles.chatLastMsg}>
                  {lastMessage
                    ? (lastMessage.text.length > 48
                        ? lastMessage.text.substring(0, 45) + "..."
                        : lastMessage.text)
                    : <span className={styles.noMsg}>No messages yet</span>
                  }
                </div>
              </div>
              <div className={styles.chatTime}>
                {lastMessage?.createdAt?.seconds &&
                  new Date(lastMessage.createdAt.seconds * 1000)
                    .toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })
                }
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
