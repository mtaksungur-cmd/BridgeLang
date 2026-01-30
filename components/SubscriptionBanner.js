import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

const PLAN_LABELS = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  vip: "VIP",
};

const PLAN_COLORS = {
  free: "#666",
  starter: "#36a",
  pro: "#eab308",
  vip: "#1464ff",
};

export default function SubscriptionBanner({ hideIfNoPlan = false }) {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("");
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        setPlan(d.subscriptionPlan || "");
        setCredits(typeof d.credits === "number" ? d.credits : null);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  if (loading) return null;
  if (!plan && hideIfNoPlan) return null;

  return (
    <div
      style={{
        background: "#f5f7ff",
        border: "1px solid #dde4fa",
        borderRadius: 12,
        margin: "18px auto 36px auto",
        padding: "16px 28px",
        maxWidth: 600,
        textAlign: "center",
        fontWeight: 500,
        boxShadow: "0 1px 8px #f1f3fa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      {!plan ? (
        <>
          <span style={{ color: "#b22", fontWeight: 600 }}>
            You don’t have an active plan.
          </span>
          <Link href="/student/subscription">
            <button
              style={{
                marginLeft: 18,
                background: "#1464ff",
                color: "#fff",
                border: 0,
                borderRadius: 7,
                padding: "7px 18px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Choose Plan
            </button>
          </Link>
        </>
      ) : plan === "free" ? (
        <>
          <span
            style={{
              color: PLAN_COLORS.free,
              fontWeight: 700,
              fontSize: 17,
              marginRight: 12,
            }}
          >
            🆓 Free Plan Active
          </span>
          <span
            style={{
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: 7,
              padding: "5px 13px",
              fontWeight: 600,
              color: "#333",
              marginRight: 12,
            }}
          >
            Unlimited profile views / 5 messages
          </span>
          <Link href="/student/subscription">
            <button
              style={{
                background: "#fff",
                color: "#1464ff",
                border: "1.5px solid #1464ff",
                borderRadius: 7,
                padding: "6px 15px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Upgrade
            </button>
          </Link>
        </>
      ) : (
        <>
          <span
            style={{
              color: PLAN_COLORS[plan] || "#1464ff",
              fontWeight: 700,
              fontSize: 17,
              marginRight: 18,
            }}
          >
            {PLAN_LABELS[plan]} Plan Active
          </span>
          {typeof credits === "number" && (
            <span
              style={{
                background: "#fff",
                border: "1px solid #dde",
                borderRadius: 7,
                padding: "5px 13px",
                fontWeight: 600,
                color: "#333",
                marginRight: 12,
              }}
            >
              {credits} lesson credits left
            </span>
          )}
          <Link href="/student/subscription">
            <button
              style={{
                background: "#fff",
                color: "#1464ff",
                border: "1.5px solid #1464ff",
                borderRadius: 7,
                padding: "6px 15px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Change Plan
            </button>
          </Link>
        </>
      )}
    </div>
  );
}
