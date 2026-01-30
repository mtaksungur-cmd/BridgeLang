import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function LoyaltyBadge({ plan, lessonsTaken = 0 }) {
  const [messagesLeft, setMessagesLeft] = useState(null);
  const [viewLimit, setViewLimit] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        setMessagesLeft(typeof d.messagesLeft === "number" ? d.messagesLeft : null);
        setViewLimit(typeof d.viewLimit === "number" ? d.viewLimit : null);
      }
    };
    fetchUser();
  }, []);

  let badge = "🎟️";
  let planText = "";
  let lessonDiscount = "";
  let loyaltyText = "";
  let infoNote = "";

  if (plan === "starter") {
    badge = "🎟️";
    planText = "Starter Plan – 10% off the first 6 lessons.";
    lessonDiscount =
      "5% review coupon automatically applied to your next lesson after leaving feedback.";
  } else if (plan === "pro") {
    badge = "🥈";
    planText = "Pro Plan – 15% off the first 6 lessons.";
    lessonDiscount =
      "10% review coupon + 10% loyalty discount every 3rd payment (both applied automatically).";
  } else if (plan === "vip") {
    badge = "🥇";
    planText = "VIP Plan – 20% off the first 6 lessons.";
    lessonDiscount =
      "15% review coupon + 20% loyalty discount every 3rd payment (applied automatically).";
    loyaltyText =
      "Every 6th renewal also gives you a 10% discount on your subscription (applied automatically).";
  } else {
    planText = "Free Plan – No discounts available.";
  }

  infoNote = `
    All eligible discounts and loyalty bonuses are applied automatically.
    You don't need to enter any coupon codes manually.
    Discounts are applied in this order: 
    1️⃣ First 6-Lesson Discount → 2️⃣ Review Bonus → 3️⃣ Loyalty Bonus.
  `;

  return (
    <div
      style={{
        border: "2px solid gold",
        borderRadius: 10,
        padding: 16,
        margin: "16px 0",
        background: "#fffbea",
        textAlign: "center",
        boxShadow: "0 2px 8px #ffeeaa60",
      }}
    >
      <span style={{ fontSize: 32 }}>{badge}</span>
      <div style={{ fontWeight: 600, marginTop: 8 }}>{planText}</div>

      <div style={{ fontSize: 14, color: "#333", marginTop: 6 }}>
        📘 Lessons Taken: <strong>{lessonsTaken}</strong>
      </div>

      {messagesLeft !== null && (
        <div style={{ fontSize: 14, color: "#333", marginTop: 6 }}>
          💬 Messages Left: <strong>{messagesLeft}</strong>
        </div>
      )}

      {viewLimit !== null && (
        <div style={{ fontSize: 14, color: "#333", marginTop: 6 }}>
          👀 Profile Views Left: <strong>{viewLimit}</strong>
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          padding: "10px 12px",
          background: "#f6ffed",
          border: "1px solid #b7eb8f",
          borderRadius: 8,
        }}
      >
        🎯 <strong>Lesson Discounts:</strong> {lessonDiscount}
      </div>

      {plan === "vip" && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            background: "#fffbe6",
            border: "1px solid #ffe58f",
            borderRadius: 8,
          }}
        >
          🏆 <strong>Subscription Loyalty:</strong> {loyaltyText}
        </div>
      )}

      <div
        style={{
          marginTop: 18,
          padding: "10px 12px",
          background: "#e6f7ff",
          border: "1px solid #91d5ff",
          borderRadius: 8,
          color: "#003a8c",
          fontSize: 13,
          textAlign: "left",
          lineHeight: "1.5em",
        }}
      >
        💡 <strong>Note:</strong> {infoNote}
      </div>
    </div>
  );
}
