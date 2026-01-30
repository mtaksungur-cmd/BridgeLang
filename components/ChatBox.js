import { useState, useEffect, useRef } from "react";
import { db } from "../lib/firebase";
import { isInappropriate } from "../lib/messageFilter";
import {
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, doc
} from "firebase/firestore";
import { useRouter } from "next/router";
import styles from "./ChatBox.module.scss";

export default function ChatBox({ chatId, userId, role, onFirstMessage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, async (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Karşı tarafın mesajlarını okundu olarak işaretle
      msgs.forEach(async (m) => {
        if (m.sender !== userId && m.read !== true) {
          await updateDoc(doc(db, "chats", chatId, "messages", m.id), {
            read: true
          });
        }
      });

      setMessages(msgs);

      setTimeout(() =>
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }),
        100);
    });
    return () => unsub();
  }, [chatId, userId]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    if (isInappropriate(text)) {
      setError("⚠️ Your message contains inappropriate content.");
      return;
    }

    if (messages.length === 0 && typeof onFirstMessage === "function") {
      await onFirstMessage();
    }

    // 🔹 Mesaj Limiti Kontrolü (Sadece öğrenciler için)
    if (role === 'student') {
      try {
        const check = await fetch('/api/chat/checkLimit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, studentId: userId })
        });
        const d = await check.json();
        if (d.allowed === false) {
          setError(
            d.reason === 'limit_reached'
              ? `You have reached the limit of ${d.limit} messages before booking. Please book a lesson to continue.`
              : 'Message limit reached.'
          );
          return;
        }
      } catch (err) {
        console.error('Check limit failed:', err);
      }
    }

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: userId,
      role,
      read: false, // yeni mesaj varsayılan okunmamış
      createdAt: serverTimestamp(),
    });

    try {
      await fetch('/api/chat/notifyMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, senderId: userId, text, role }),
      });
    } catch (err) {
      console.warn('⚠️ notifyMessage failed:', err);
    }

    // 🔹 Kayıt: İlgi Gösterildi (Availability Reminder için)
    if (role === 'student') {
      fetch('/api/student/recordInterest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, studentId: userId, action: 'message' })
      }).catch(() => { });
    }

    setInput("");
    setError("");
  };

  const handleExitChat = () => {
    if (role === "student") {
      router.push("/student/chats");
    } else {
      router.push("/teacher/chats");
    }
  };

  return (
    <div className={styles.container}>
      {/* Üst bar */}
      <div className={styles.topBar}>
        <button onClick={handleExitChat} className={styles.closeBtn}>✖</button>
        <span className={styles.chatTitle}>Chat</span>
      </div>

      {/* Mesajlar */}
      <div className={styles.messages}>
        {messages.length === 0 && (
          <p className={styles.noMessages}>No messages yet.</p>
        )}
        {messages.map(m => {
          const mine = m.sender === userId;
          const wrapperClass = mine
            ? `${styles.message} ${styles['message--mine']}`
            : `${styles.message} ${styles['message--theirs']}`;

          return (
            <div key={m.id} className={wrapperClass}>
              <span className={styles.message__bubble}>
                {m.text}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Mesaj gönderme formu */}
      <form onSubmit={handleSend} className={styles.form}>
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={e => {
            setInput(e.target.value);
            if (error) setError("");
          }}
          className={styles.input}
        />
        <button type="submit" className={styles.button}>
          Send
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
