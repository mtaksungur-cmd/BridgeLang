import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import ChatBox from "../../../components/ChatBox";

export default function StudentChatPage() {
  const router = useRouter();
  const { id } = router.query; // id = `${studentId}_${teacherId}`
  const [user, setUser] = useState(null);
  const [chatExists, setChatExists] = useState(false);

  useEffect(() => {
    // Kullanıcıyı çek
    const unsub = auth.onAuthStateChanged(async (usr) => {
      if (!usr) router.push("/login");
      else setUser(usr);
    });
    return () => unsub();
  }, [router]);

  // İlk mesajda mesaj hakkı düş (eğer chat yoksa)
  const handleFirstMessage = async () => {
    // Chat parent dokümanını oluştur (varsa zaten oluşturulmaz)
    const chatRef = doc(db, "chats", id);
    const snap = await getDoc(chatRef);
    if (!snap.exists()) {
      // Chat ilk defa başlatılıyor
      // userId ve teacherId ayır
      const [studentId, teacherId] = id.split("_");
      await setDoc(chatRef, {
        studentId,
        teacherId,
        participants: [studentId, teacherId],
        createdAt: new Date(),
      });
      // Mesaj hakkı düşür
      await fetch("/api/decrement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: studentId, type: "message" }),
      });
    }
    setChatExists(true);
  };

  if (!user) return null;
  // Sadece student mesaj başlatabilir, teacher mesaj yazamaz (kısıtlamayı backend'de yapmaya gerek yok, UI ile çözülür)

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
