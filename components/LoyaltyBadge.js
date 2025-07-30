export default function LoyaltyBadge({ plan, loyaltyMonths, loyaltyBonusCount, discountEligible }) {
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
    </div>
  );
}
