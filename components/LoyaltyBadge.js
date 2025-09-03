export default function LoyaltyBadge({ plan, loyaltyMonths, loyaltyBonusCount, discountEligible, promoCode }) {
  let text = "";
  let badge = "";

  if (!plan || plan === 'starter') {
    badge = "🎟️";
    text = "No loyalty program on Starter plan.";
  } else if (plan === 'pro') {
    badge = "🥈";
    if (loyaltyBonusCount > 0)
      text = `Loyalty Bonus: +${loyaltyBonusCount} lesson credit(s) (${loyaltyMonths} months on Pro)!`;
    else
      text = `Loyalty: ${loyaltyMonths || 0} consecutive months on Pro.`;
  } else if (plan === 'vip') {
    badge = "🥇";
    if (discountEligible)
      text = `VIP Discount: 10% off for next renewal!`;
    else if (loyaltyBonusCount > 0)
      text = `VIP Loyalty Bonus: +${loyaltyBonusCount} lesson credit(s) (${loyaltyMonths} months)!`;
    else
      text = `VIP Loyalty: ${loyaltyMonths || 0} consecutive months.`;
  }

  const copy = () => {
    if (!promoCode) return;
    navigator.clipboard?.writeText(promoCode).catch(()=>{});
  };

  return (
    <div style={{
      border: "2px solid gold",
      borderRadius: 10,
      padding: 16,
      margin: "16px 0",
      background: "#fffbea",
      textAlign: "center",
      boxShadow: "0 2px 8px #ffeeaa60"
    }}>
      <span style={{ fontSize: 32 }}>{badge}</span>
      <div style={{ fontWeight: 600, marginTop: 8 }}>{text}</div>
      {plan !== 'starter' && (
        <div style={{ fontSize: 12, marginTop: 5, color: "#999" }}>
          Stay on {plan === 'vip' ? "VIP" : "Pro"} 3+ months to earn loyalty bonus!
        </div>
      )}

      {/* PROMO CODE: varsa göster */}
      {plan === 'vip' && promoCode && (
        <div style={{
          marginTop: 12,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          border: '1px dashed #d4b106',
          background: '#fff',
          padding: '8px 12px',
          borderRadius: 8
        }}>
          <span style={{ fontWeight: 700 }}>Your 10% code:</span>
          <code style={{ fontWeight: 700 }}>{promoCode}</code>
          <button onClick={copy} style={{
            marginLeft: 4, padding: '4px 8px', borderRadius: 6,
            border: '1px solid #d4b106', background: '#fff7e6', cursor: 'pointer'
          }}>
            Copy
          </button>
        </div>
      )}
    </div>
  );
}