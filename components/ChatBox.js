import { useState, useEffect, useRef } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

export default function ChatBox({ chatId, userId, role, onFirstMessage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Dinamik olarak mesajları dinle
  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsub();
  }, [chatId]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    // Eğer ilk mesaj ise parent'a haber ver (ör: mesaj hakkı düşsün)
    if (messages.length === 0 && typeof onFirstMessage === "function") {
      await onFirstMessage();
    }

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: userId,
      role,
      createdAt: serverTimestamp(),
    });
    setInput("");
  };

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 10, padding: 16, maxWidth: 520, margin: "auto" }}>
      <div style={{ minHeight: 240, maxHeight: 320, overflowY: "auto", marginBottom: 12, background: "#fafcff", padding: 8 }}>
        {messages.length === 0 && <p style={{ color: "#aaa" }}>No messages yet.</p>}
        {messages.map((m) => {
          const isMine = m.sender === userId;
          return (
            <div
              key={m.id}
              style={{
                textAlign: isMine ? "right" : "left",
                margin: "6px 0",
                display: "flex",
                flexDirection: isMine ? "row-reverse" : "row",
              }}
            >
              <span
                style={{
                  background: isMine ? "#e6f0fd" : "#f2f2f2",
                  borderRadius: 7,
                  padding: "7px 15px",
                  display: "inline-block",
                  maxWidth: 320,
                  wordBreak: "break-word",
                }}
              >
                {m.text}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ flex: 1, padding: 8, borderRadius: 7, border: "1px solid #ccc" }}
        />
        <button type="submit" style={{ border: 0, borderRadius: 7, background: "#1464ff", color: "#fff", fontWeight: 600, padding: "0 20px" }}>
          Send
        </button>
      </form>
    </div>
  );
}
