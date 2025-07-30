import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import StudentLayout from "../../components/StudentLayout";
import { useRouter } from "next/router";

// Abonelik planlarını burada tanımla
const PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: "£19.99/mo",
    desc: "3 lesson credits/month · 10 teacher views · 3 messages",
    features: [
      "3 lesson credits/month",
      "10 teacher profiles/month",
      "3 message rights/month",
      "Bonus: 1 credit for first review (only first month)",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "£39.99/mo",
    desc: "6 credits · 30 teacher views · 10 messages · loyalty bonus",
    features: [
      "6 lesson credits/month",
      "30 teacher profiles/month",
      "10 message rights/month",
      "Loyalty bonus (after 3 months)",
      "Bonus: 1 credit for first review (only first month)",
    ],
  },
  {
    key: "vip",
    name: "VIP",
    price: "£79.99/mo",
    desc: "12 credits · Unlimited views/messages · loyalty bonus/discount",
    features: [
      "12 lesson credits/month",
      "Unlimited teacher profiles",
      "Unlimited messaging",
      "Loyalty bonus (after 3 months)",
      "6th month: 10% discount",
      "Bonus: 1 credit for first review (only first month)",
    ],
  },
];

export default function SubscriptionPage() {
  const [activePlan, setActivePlan] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setActivePlan(snap.data().subscriptionPlan || "");
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleSelect = async (planKey) => {
  setSaving(true);
  const user = auth.currentUser;
  if (!user) return;

  // Kullanıcı emaili şart!
  const userEmail = user.email;

  // Stripe checkout session başlat
  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.uid,
        userEmail,
        planKey,
      })
    });
    const data = await res.json();
    if (data.url) {
      // Stripe Checkout yönlendir!
      window.location.href = data.url;
    } else {
      alert(data.error || "An error occurred.");
    }
  } catch (err) {
    alert("Could not start payment.");
    console.error(err);
  }
  setSaving(false);
};


  if (loading) return <p>Loading...</p>;

  return (
    <StudentLayout>
      <div style={{ padding: 40, maxWidth: 720, margin: "auto" }}>
        <h2>Choose Your Subscription Plan</h2>
        <p>
          Access lessons, view teachers and send messages based on your chosen
          plan.
        </p>
        <div style={{
          display: "flex",
          gap: 30,
          justifyContent: "center",
          marginTop: 30,
        }}>
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              style={{
                border: activePlan === plan.key ? "2px solid #1464ff" : "1px solid #ccc",
                borderRadius: 14,
                padding: 32,
                width: 220,
                textAlign: "center",
                background: "#fafcff",
                boxShadow: activePlan === plan.key ? "0 2px 12px #e0eaff" : "0 1px 8px #eee"
              }}
            >
              <h3 style={{ color: "#1464ff" }}>{plan.name}</h3>
              <div style={{ fontWeight: 600, fontSize: 22 }}>{plan.price}</div>
              <div style={{ margin: "12px 0", fontSize: 14, color: "#555" }}>{plan.desc}</div>
              <ul style={{ listStyle: "disc", textAlign: "left", paddingLeft: 20 }}>
                {plan.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <button
                style={{
                  marginTop: 12,
                  padding: "8px 24px",
                  border: 0,
                  borderRadius: 8,
                  background: "#1464ff",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: activePlan === plan.key ? "not-allowed" : "pointer",
                  opacity: activePlan === plan.key ? 0.7 : 1
                }}
                disabled={saving || activePlan === plan.key}
                onClick={() => handleSelect(plan.key)}
              >
                {activePlan === plan.key ? "Selected" : "Select"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}
