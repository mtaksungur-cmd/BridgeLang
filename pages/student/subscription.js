import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import styles from "../../scss/SubscriptionPage.module.scss";
import Script from "next/script";

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "£0.00",
    features: [
      "View unlimited teacher profiles",
      "Up to 5 messages before booking",
      "Reward: 25% Review Discount"
    ],
    description:
      "Perfect for trying BridgeLang risk-free.",
  },
  {
    key: "starter",
    name: "Starter",
    price: "£4.99 • 1-month access",
    features: [
      "View unlimited teacher profiles",
      "Up to 10 messages before booking",
      "Reward: 30% Review Discount"
    ],
    description:
      "Ideal for starting your journey with more flexibility.",
  },
  {
    key: "pro",
    name: "Pro",
    price: "£9.99 • 1-month access",
    features: [
      "View unlimited teacher profiles",
      "Up to 20 messages before booking",
      "Reward: 35% Review Discount"
    ],
    description:
      "Great for serious learners making steady progress.",
  },
  {
    key: "vip",
    name: "VIP",
    price: "£14.99 • 1-month access",
    features: [
      "View unlimited teacher profiles",
      "Unlimited messages before booking",
      "Reward: 40% Review Discount",
      "Priority Support"
    ],
    description:
      "Maximum freedom and highest rewards for committed learners.",
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
        window.fbq('track', 'InitiateCheckout', {
          content_type: 'subscription',
          plan: planKey
        });

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
      <h2 className={styles.title}>Explore Your Options</h2>

      {/* Centered policy box */}
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <div className={styles.policyBox} style={{ maxWidth: 800, width: "100%" }}>
          <h3>Plan Change Policy</h3>
          <ul>
            <li>
              <b>Upgrade:</b> Takes effect immediately. Remaining days are prorated.
            </li>
            <li>
              <b>Downgrade:</b> Takes effect after your current plan expires.
            </li>
          </ul>

          <p style={{ marginTop: 8, lineHeight: 1.5, fontSize: "0.9rem" }}>
            <strong>All plans are one-time purchases and valid for 1 month.</strong><br />
            They do not auto-renew. You stay in control.<br />
            <strong>You can switch plans anytime — the new plan starts immediately.</strong>
          </p>
        </div>
      </div>

      <div className={styles.planList}>
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`${styles.planCard} ${activePlan === plan.key ? styles.active : ""
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
              {activePlan === plan.key ? "Selected" : "Select Plan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
