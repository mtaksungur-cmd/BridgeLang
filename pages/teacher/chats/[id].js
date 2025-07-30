import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth } from "../../../lib/firebase";
import TeacherLayout from "../../../components/TeacherLayout";
import ChatBox from "../../../components/ChatBox";

export default function TeacherChatPage() {
  const router = useRouter();
  const { id } = router.query; // id = `${studentId}_${teacherId}`
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Kullanıcıyı çek
    const unsub = auth.onAuthStateChanged(async (usr) => {
      if (!usr) router.push("/login");
      else setUser(usr);
    });
    return () => unsub();
  }, [router]);

  if (!user) return null;

  return (
    <TeacherLayout>
      <div style={{ maxWidth: 600, margin: "auto", paddingTop: 40 }}>
        <h2>Chat with Student</h2>
        <ChatBox
          chatId={id}
          userId={user.uid}
          role="teacher"
          // onFirstMessage yok, teacher ilk mesaj atamaz
        />
      </div>
    </TeacherLayout>
  );
}
