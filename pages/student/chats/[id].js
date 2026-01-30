// pages/student/chats/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import ChatBox from "../../../components/ChatBox";

export default function StudentChatPage() {
  const router = useRouter();
  const { id } = router.query; // id = `${studentId}_${teacherId}`
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (usr) => {
      if (!usr) router.push("/login");
      else setUser(usr);
    });
    return () => unsub();
  }, [router]);

  const handleFirstMessage = async () => {
    if (!user || !id) return;
    const chatRef = doc(db, "chats", id);
    const snap = await getDoc(chatRef);

    if (!snap.exists()) {
      const [studentId, teacherId] = id.split("_");

      await setDoc(chatRef, {
        studentId,
        teacherId,
        participants: [user.uid, teacherId], // 🔥 student’ın gerçek UID’si
        createdAt: new Date(),
      });
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 600, margin: "auto", paddingTop: 40 }}>
      <h2>Chat with Teacher</h2>
      <ChatBox
        chatId={id}
        userId={user.uid}
        role="student"
        onFirstMessage={handleFirstMessage}
      />
    </div>
  );
}
