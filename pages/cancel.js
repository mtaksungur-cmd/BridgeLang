import Link from "next/link";
export default function Cancel() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Payment Cancelled ❌</h1>
      <p>Your payment was cancelled. You can try again.</p>
      <Link href="/student/dashboard">Go to Dashboard</Link>
    </div>
  );
}
