export default function LoyaltyBadge({
  plan,
  loyaltyMonths,
  loyaltyBonusCount,
  discountEligible,
  promoCode,
  lessonCoupons = [],     // 🔹 Firestore’dan gelecek ders kuponları
  subscriptionCoupons = [] // 🔹 Abonelik kuponları (VIP özel)
}) {
  let text = "";
  let badge = "";

  if (!plan || plan === 'starter') {
    badge = "🎟️";
    text = "Starter Plan – 10% discount on your first 6 lessons.";
  } else if (plan === 'pro') {
    badge = "🥈";
    text = `Pro Plan – 15% discount on your first 6 lessons.`;
  } else if (plan === 'vip') {
    badge = "🥇";
    text = `VIP Plan – 20% discount on your first 6 lessons.`;
  }

  const copy = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code).catch(() => {});
  };

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
      <div style={{ fontWeight: 600, marginTop: 8 }}>{text}</div>

      {plan !== 'starter' && (
        <div style={{ fontSize: 12, marginTop: 5, color: "#999" }}>
          Stay on {plan === 'vip' ? "VIP" : "Pro"} plan for 3+ months to unlock loyalty bonuses.
        </div>
      )}

      {/* 🔹 İlk 6 Ders İndirimi (bilgilendirme) */}
      <div
        style={{
          marginTop: 16,
          padding: "10px 12px",
          background: "#f6ffed",
          border: "1px solid #b7eb8f",
          borderRadius: 8,
          fontSize: 14,
        }}
      >
        🎯 <strong>First 6 Lessons:</strong>{" "}
        {plan === "starter" && "10% off each lesson"}
        {plan === "pro" && "15% off each lesson"}
        {plan === "vip" && "20% off each lesson"}
      </div>

      {/* 🔹 Ders Kuponları (Yorum ve Sadakat kuponları) */}
      {lessonCoupons && lessonCoupons.length > 0 && (
        <div
          style={{
            marginTop: 16,
            borderTop: "1px solid #ddd",
            paddingTop: 10,
            textAlign: "left",
          }}
        >
          <h4 style={{ margin: "6px 0", fontSize: 15 }}>🎟️ Lesson Coupons</h4>
          {lessonCoupons.map((c, i) => (
            <div
              key={i}
              style={{
                background: c.used ? "#f5f5f5" : "#e6fffb",
                border: "1px dashed #91d5ff",
                padding: "8px 10px",
                borderRadius: 6,
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <strong>{c.code}</strong> – {c.discount}% off{" "}
                {c.used ? "(Used)" : "(Available)"}
              </div>
              {!c.used && (
                <button
                  onClick={() => copy(c.code)}
                  style={{
                    border: "1px solid #91d5ff",
                    background: "#fff",
                    borderRadius: 6,
                    padding: "3px 6px",
                    cursor: "pointer",
                  }}
                >
                  Copy
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 🔹 VIP Abonelik Kuponu */}
      {plan === "vip" && promoCode && (
        <div
          style={{
            marginTop: 16,
            borderTop: "1px solid #ddd",
            paddingTop: 10,
          }}
        >
          <h4 style={{ margin: "6px 0", fontSize: 15 }}>💎 Subscription Coupon</h4>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "1px dashed #d4b106",
              background: "#fff",
              padding: "8px 12px",
              borderRadius: 8,
            }}
          >
            <span style={{ fontWeight: 700 }}>Code:</span>
            <code style={{ fontWeight: 700 }}>{promoCode}</code>
            <button
              onClick={() => copy(promoCode)}
              style={{
                marginLeft: 4,
                padding: "4px 8px",
                borderRadius: 6,
                border: "1px solid #d4b106",
                background: "#fff7e6",
                cursor: "pointer",
              }}
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* 🔹 VIP Sadakat Abonelik Kuponları */}
      {plan === "vip" && subscriptionCoupons && subscriptionCoupons.length > 0 && (
        <div
          style={{
            marginTop: 16,
            borderTop: "1px solid #ddd",
            paddingTop: 10,
            textAlign: "left",
          }}
        >
          <h4 style={{ margin: "6px 0", fontSize: 15 }}>🏆 VIP Loyalty Coupons</h4>
          {subscriptionCoupons.map((c, i) => (
            <div
              key={i}
              style={{
                background: c.used ? "#f5f5f5" : "#fffbe6",
                border: "1px dashed #ffe58f",
                padding: "8px 10px",
                borderRadius: 6,
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <strong>{c.code}</strong> – {c.discount}% off{" "}
                {c.used ? "(Used)" : "(Available)"}
              </div>
              {!c.used && (
                <button
                  onClick={() => copy(c.code)}
                  style={{
                    border: "1px solid #ffd666",
                    background: "#fff",
                    borderRadius: 6,
                    padding: "3px 6px",
                    cursor: "pointer",
                  }}
                >
                  Copy
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
