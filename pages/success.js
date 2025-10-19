// pages/success.js
import Head from "next/head";
import Link from "next/link";

export default function Success() {
  return (
    <>
      <Head>
        <title>Payment Successful | BridgeLang</title>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              gtag('event', 'conversion', {'send_to': 'AW-17608551252/T34CCPf6sqbENTtWmXb'});
            `,
          }}
        />
      </Head>

      <div style={{ padding: 40, textAlign: "center" }}>
        <h1>Payment Successful ✅</h1>
        <p>Your payment has been processed successfully.</p>
        <Link href="/student/dashboard">Go to Dashboard</Link>
      </div>
    </>
  );
}
