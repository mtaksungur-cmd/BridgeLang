import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Check, Sparkles, Zap } from 'lucide-react';
import SeoHead from '../../components/SeoHead';

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "£0",
    period: "forever",
    features: [
      "View unlimited teacher profiles",
      "Up to 5 messages before booking",
      "25% Review Discount"
    ],
    description: "Perfect for trying BridgeLang risk-free.",
  },
  {
    key: "starter",
    name: "Starter",
    price: "£4.99",
    period: "1-month access",
    features: [
      "View unlimited teacher profiles",
      "Up to 10 messages before booking",
      "30% Review Discount"
    ],
    description: "Ideal for starting your journey with more flexibility.",
    popular: false,
  },
  {
    key: "pro",
    name: "Pro",
    price: "£9.99",
    period: "1-month access",
    features: [
      "View unlimited teacher profiles",
      "Up to 20 messages before booking",
      "35% Review Discount"
    ],
    description: "Great for serious learners making steady progress.",
    popular: true,
  },
  {
    key: "vip",
    name: "VIP",
    price: "£14.99",
    period: "1-month access",
    features: [
      "View unlimited teacher profiles",
      "Unlimited messages before booking",
      "40% Review Discount",
      "Priority Support"
    ],
    description: "Maximum freedom and highest rewards for committed learners.",
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
        if (window.fbq) {
          window.fbq('track', 'InitiateCheckout', {
            content_type: 'subscription',
            plan: planKey
          });
        }
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #e8eef7 0%, #d4ddf0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#64748b', fontWeight: '600', fontSize: '0.9375rem' }}>Loading plans...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <SeoHead
        title="Subscription Plans"
        description="Choose the perfect plan for your learning journey. Free, Premium, or VIP membership options available."
      />
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #e8eef7 0%, #d4ddf0 100%)' }} className="animate-fade-in">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
              Choose Your Plan
            </h1>
            <p style={{ fontSize: '1rem', color: '#64748b' }}>
              Select the perfect plan for your learning journey
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          {/* Policy Notice */}
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: '600', color: '#0f172a', marginBottom: '1rem' }}>
              Plan Change Policy
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0' }}>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>Upgrade:</span> Takes effect immediately. Remaining days are prorated.
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0' }}>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>Downgrade:</span> Takes effect after your current plan expires.
                </p>
              </div>
            </div>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid #3b82f6' }}>
              <p style={{ fontSize: '0.875rem', color: '#475569', margin: '0', lineHeight: '1.6' }}>
                <strong>All plans are one-time purchases and valid for 1 month.</strong> They do not auto-renew. You stay in control. <strong>You can switch plans anytime — the new plan starts immediately.</strong>
              </p>
            </div>
          </div>

          {/* Plans Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem'
          }}>
            {PLANS.map((plan) => {
              const isActive = activePlan === plan.key;
              const isPro = plan.popular;

              return (
                <div
                  key={plan.key}
                  style={{
                    background: 'white',
                    border: isActive ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Popular Badge */}
                  {isPro && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#3b82f6',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Sparkles style={{ width: '12px', height: '12px' }} />
                      POPULAR
                    </div>
                  )}

                  {/* Active Badge */}
                  {isActive && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      background: '#dcfce7',
                      color: '#166534',
                      padding: '0.375rem 0.625rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      marginBottom: '1rem',
                      width: 'fit-content'
                    }}>
                      <Check style={{ width: '12px', height: '12px' }} />
                      CURRENT PLAN
                    </div>
                  )}

                  {/* Plan Name */}
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                      <span style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a' }}>
                        {plan.price}
                      </span>
                      {plan.period !== 'forever' && (
                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                          / month
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                      {plan.period}
                    </p>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
                    {plan.description}
                  </p>

                  {/* Features */}
                  <div style={{ marginBottom: '1.5rem', flex: '1' }}>
                    {plan.features.map((feature, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        marginBottom: '0.75rem'
                      }}>
                        <Check style={{ width: '16px', height: '16px', color: '#22c55e', flexShrink: '0', marginTop: '2px' }} />
                        <span style={{ fontSize: '0.875rem', color: '#475569' }}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelect(plan.key)}
                    disabled={saving || isActive}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isActive ? '#e2e8f0' : (isPro ? '#3b82f6' : 'white'),
                      color: isActive ? '#64748b' : (isPro ? 'white' : '#3b82f6'),
                      border: isActive ? 'none' : (isPro ? 'none' : '1px solid #cbd5e1'),
                      borderRadius: '6px',
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      cursor: (saving || isActive) ? 'not-allowed' : 'pointer',
                      marginTop: 'auto'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive && !saving) {
                        e.currentTarget.style.background = isPro ? '#2563eb' : '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = isPro ? '#3b82f6' : 'white';
                      }
                    }}
                  >
                    {saving ? 'Processing...' : (isActive ? 'Current Plan' : 'Select Plan')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
