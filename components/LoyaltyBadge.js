export default function LoyaltyBadge({
  plan,
  lessonsTaken = 0,
  subscriptionCoupons = [],
}) {
  let badge = "🎟️";
  let planText = "";
  let lessonDiscount = "";
  let loyaltyText = "";

  if (plan === "starter") {
    badge = "🎟️";
    planText = "Starter Plan – 10% off the first 6 lessons.";
    lessonDiscount =
      "5% review coupon available per review. Lesson discounts are automatically applied.";
  } else if (plan === "pro") {
    badge = "🥈";
    planText = "Pro Plan – 15% off the first 6 lessons.";
    lessonDiscount =
      "10% review coupon + 10% loyalty discount every 3rd payment. Lesson discounts are applied automatically.";
  } else if (plan === "vip") {
    badge = "🥇";
    planText = "VIP Plan – 20% off the first 6 lessons.";
    lessonDiscount =
      "15% review coupon + 20% loyalty discount every 3rd payment (auto).";
    loyaltyText =
      "Every 6th renewal: 10% off subscription (manual code entry required).";
  } else {
    planText = "Free Plan – No discounts available.";
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
      <div style={{ fontWeight: 600, marginTop: 8 }}>{planText}</div>

      <div style={{ fontSize: 14, color: "#333", marginTop: 6 }}>
        📘 Lessons Taken: <strong>{lessonsTaken}</strong>
      </div>

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

      {subscriptionCoupons?.length > 0 && (
        <div
          style={{
            marginTop: 20,
            borderTop: "1px solid #ddd",
            paddingTop: 10,
            textAlign: "left",
          }}
        >
          <h4 style={{ margin: "6px 0", fontSize: 15 }}>
            🎟️ Subscription Coupons
          </h4>
          <p
            style={{
              fontSize: 13,
              color: "#555",
              marginBottom: 8,
            }}
          >
            These coupons can be used <strong>manually</strong> during your next
            subscription payment. Copy the code and enter it at checkout.
          </p>

          {subscriptionCoupons.map((c, i) => (
            <div
              key={i}
              style={{
                background: c.used ? "#f5f5f5" : "#fffaf0",
                border: "1px dashed #ffc069",
                padding: "8px 10px",
                borderRadius: 6,
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <strong>{c.code}</strong> – {c.discount || c.percent}% off{" "}
                {c.used ? "(Used)" : "(Available)"}
              </div>
              {!c.used && (
                <button
                  onClick={() => copy(c.code)}
                  style={{
                    border: "1px solid #ffa940",
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
