import Link from "next/link";
export default function Success() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Payment Successful ✅</h1>
      <p>Your payment has been processed successfully.</p>
      <Link href="/student/dashboard">Go to Dashboard</Link>
    </div>
  );
}
