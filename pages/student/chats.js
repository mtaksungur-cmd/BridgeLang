import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { collection, getDocs, doc, getDoc, query } from "firebase/firestore";
import StudentLayout from "../../components/StudentLayout";

export default function StudentChatsPage() {
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (usr) => {
      if (!usr) return router.push("/login");
      setUser(usr);

      // Tüm chat'leri getir (chatId studentId ile başlıyor)
      const chatsSnap = await getDocs(collection(db, "chats"));
      const myChats = [];
      for (let chatDoc of chatsSnap.docs) {
        if (!chatDoc.id.startsWith(usr.uid + "_")) continue;
        // Son mesajı çek
        const messagesSnap = await getDocs(
          query(collection(db, "chats", chatDoc.id, "messages"))
        );
        const messages = messagesSnap.docs.map(d => d.data());
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        // Öğretmeni getir
        const [, teacherId] = chatDoc.id.split("_");
        const teacherSnap = await getDoc(doc(db, "users", teacherId));
        const teacher = teacherSnap.exists() ? teacherSnap.data() : {};

        myChats.push({
          chatId: chatDoc.id,
          teacher,
          lastMessage,
        });
      }
      // Son mesaj zamanına göre sırala (yeni en üstte)
      myChats.sort((a, b) =>
        (b.lastMessage?.createdAt?.seconds || 0) - (a.lastMessage?.createdAt?.seconds || 0)
      );
      setChats(myChats);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) return <StudentLayout><p>Loading chats...</p></StudentLayout>;
  if (chats.length === 0) return (
    <StudentLayout>
      <div style={{ padding: 40 }}>
        <h2>Your Chats</h2>
        <p>No conversations yet.</p>
      </div>
    </StudentLayout>
  );

  return (
    <StudentLayout>
      <div style={{ padding: 40, maxWidth: 600, margin: "auto" }}>
        <h2>Your Chats</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {chats.map(({ chatId, teacher, lastMessage }) => (
            <li
              key={chatId}
              onClick={() => router.push(`/student/chats/${chatId}`)}
              style={{
                padding: 16,
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                background: "#fafcff",
                marginBottom: 3,
                borderRadius: 7,
              }}
            >
              {teacher.profilePhotoUrl && (
                <img
                  src={teacher.profilePhotoUrl}
                  alt="Teacher"
                  width={48}
                  height={48}
                  style={{ borderRadius: "50%", marginRight: 16 }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>
                  {teacher.name || "Unknown Teacher"}
                </div>
                <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                  {lastMessage
                    ? (lastMessage.text.length > 48
                        ? lastMessage.text.substring(0, 45) + "..."
                        : lastMessage.text)
                    : <span style={{ color: "#aaa" }}>No messages yet</span>
                  }
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#999", minWidth: 85, textAlign: "right" }}>
                {lastMessage?.createdAt?.seconds &&
                  new Date(lastMessage.createdAt.seconds * 1000)
                    .toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })
                }
              </div>
            </li>
          ))}
        </ul>
      </div>
    </StudentLayout>
  );
}
