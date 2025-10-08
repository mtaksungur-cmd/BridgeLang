import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import styles from "../../scss/SubscriptionPage.module.scss";

const PLANS = [
  { key: "free", name: "Free", price: "£0.00", features: [
    "10 teacher profiles/month",
    "3 messages/month",
    "No discounts or coupons"
  ]},
  { key: "starter", name: "Starter", price: "£4.99", features: [
    "30 teacher profiles/month",
    "8 messages/month",
    "10% discount on first 6 lessons",
    "5% review coupon"
  ]},
  { key: "pro", name: "Pro", price: "£9.99", features: [
    "60 teacher profiles/month",
    "20 messages/month",
    "15% discount on first 6 lessons",
    "10% review coupon",
    "Loyalty: 10% coupon every 3 months"
  ]},
  { key: "vip", name: "VIP", price: "£14.99", features: [
    "Unlimited teacher profiles",
    "Unlimited messages",
    "20% discount on first 6 lessons",
    "15% review coupon",
    "Loyalty: 20% coupon every 3 months",
    "Permanent 10% discount at 6/12/18 months"
  ]}
];

export default function SubscriptionPage() {
  const [activePlan, setActivePlan] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (!user) return setLoading(false);
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setActivePlan(snap.data().subscriptionPlan || "free");
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSelect = async (planKey) => {
    if (planKey === "free") return;
    setSaving(true);
    const user = auth.currentUser;
    if (!user) return alert("Please log in again.");
    try {
      const res = await fetch("/api/payment/plan-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          planKey,
          currentPlan: activePlan
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.message || data.error || "Error occurred.");
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
      <div className={styles.policyBox}>
        <h3>Subscription Change Policy</h3>
        <ul>
          <li><b>Upgrade:</b> Takes effect immediately. The remaining days are prorated and charged.</li>
          <li><b>Downgrade:</b> Takes effect at the end of the current billing cycle. No refunds are issued.</li>
        </ul>
      </div>
      <div className={styles.planList}>
        {PLANS.map((plan) => (
          <div key={plan.key} className={`${styles.planCard} ${activePlan === plan.key ? styles.active : ""}`}>
            <h3>{plan.name}</h3>
            <div className={styles.planPrice}>{plan.price}</div>
            <ul className={styles.planFeatures}>
              {plan.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <button onClick={() => handleSelect(plan.key)} disabled={saving}>
              {activePlan === plan.key ? "Selected" : "Change Plan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
