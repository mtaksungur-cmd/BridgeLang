// pages/student/subscription.js
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import styles from "../../scss/SubscriptionPage.module.scss";

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

  // Kullanıcı planını yükle
  useEffect(() => {
    const getUser = async () => {
      const user = auth.currentUser;
      if (!user) return setLoading(false);
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setActivePlan(snap.data().subscriptionPlan || "");
      }
      setLoading(false);
    };
    getUser();
  }, []);

  // /student/subscription?renew=1 ile gelindiyse mevcut plan için otomatik checkout
  useEffect(() => {
    if (loading) return;
    const cameForRenew =
      router.query.renew === "1" &&
      typeof window !== "undefined" &&
      sessionStorage.getItem("bl_expired_redirect") === "1";

    if (!cameForRenew) return;

    // Tek seferlik çalışsın
    sessionStorage.removeItem("bl_expired_redirect");

    if (activePlan) {
      const ok = window.confirm(
        `Your ${activePlan.toUpperCase()} plan has expired. Renew now?`
      );
      if (ok) handleSelect(activePlan);
    }
  }, [loading, activePlan, router.query]);

  const handleSelect = async (planKey) => {
    setSaving(true);
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in again.");
      setSaving(false);
      return;
    }
    const userEmail = user.email;

    try {
      const res = await fetch("/api/payment/plan-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          userEmail,
          planKey,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "An error occurred.");
      }
    } catch (err) {
      console.error("plan checkout error:", err);
      alert("Could not start payment.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Choose Your Subscription Plan</h2>
      <p className={styles.subtitle}>
        Access lessons, view teachers and send messages based on your chosen plan.
      </p>

      <div className={styles.planList}>
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`${styles.planCard} ${
              activePlan === plan.key ? styles.active : ""
            }`}
          >
            <h3 className={styles.planName}>{plan.name}</h3>
            <div className={styles.planPrice}>{plan.price}</div>
            <div className={styles.planDesc}>{plan.desc}</div>
            <ul className={styles.planFeatures}>
              {plan.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <button
              className={styles.selectBtn}
              disabled={saving || activePlan === plan.key}
              onClick={() => handleSelect(plan.key)}
            >
              {activePlan === plan.key ? "Selected" : saving ? "Processing..." : "Select"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
