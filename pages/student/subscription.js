import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import styles from "../../scss/SubscriptionPage.module.scss";

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "£0.00/month",
    features: [
      "View up to 10 teacher profiles per month",
      "Send up to 3 messages per month",
      "No discounts or coupons"
    ],
    description:
      "Perfect for trying BridgeLang risk-free and discovering how fun English learning can be.",
  },
  {
    key: "starter",
    name: "Starter",
    price: "£4.99/month",
    features: [
      "View up to 30 teacher profiles per month",
      "Send up to 8 messages per month",
      "10% discount on your first 6 lessons",
      "5% review coupon (usable after your first 6-lesson period)"
    ],
    description:
      "Ideal for taking your first confident step in English and seeing progress from day one.",
  },
  {
    key: "pro",
    name: "Pro",
    price: "£9.99/month",
    features: [
      "View up to 60 teacher profiles per month",
      "Send up to 20 messages per month",
      "15% discount on your first 6 lessons",
      "10% review coupon (usable after your first 6-lesson period)",
      "Loyalty: 10% coupon every 3 months"
    ],
    description:
      "Great for serious learners who love steady progress and regular rewards.",
  },
  {
    key: "vip",
    name: "VIP",
    price: "£14.99/month",
    features: [
      "Unlimited teacher profile views",
      "Unlimited messages",
      "20% discount on your first 6 lessons",
      "15% review coupon (usable after your first 6-lesson period)",
      "Loyalty: 20% coupon every 3 months",
      "Permanent 10% discount at months 6, 12, and 18"
    ],
    description:
      "Perfect for fully committed learners who want premium access and exclusive rewards.",
  },
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
          currentPlan: activePlan,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.message) {
        alert(data.message);
        window.location.reload();
      } else if (data.error) {
        alert(data.error);
      } else {
        alert("Unexpected response.");
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

      <div className={styles.policyBox}>
        <h3>Subscription Change Policy</h3>
        <ul>
          <li>
            <b>Upgrade:</b> Takes effect immediately. Remaining days are prorated.
          </li>
          <li>
            <b>Downgrade:</b> Takes effect after your current billing cycle ends.
          </li>
        </ul>
      </div>

      <div className={styles.planList}>
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`${styles.planCard} ${
              activePlan === plan.key ? styles.active : ""
            }`}
          >
            <h3>{plan.name} Plan</h3>
            <div className={styles.planPrice}>{plan.price}</div>
            <ul className={styles.planFeatures}>
              {plan.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <p className={styles.planDescription}>{plan.description}</p>
            <button onClick={() => handleSelect(plan.key)} disabled={saving}>
              {activePlan === plan.key ? "Selected" : "Change Plan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
