// pages/success.js
import Head from "next/head";
import Link from "next/link";
import Script from "next/script";

export default function Success() {
  return (
    <>
      <Head>
        <title>Payment Successful | BridgeLang</title>

        {/* Google ADS conversion */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              gtag('event', 'conversion', {'send_to': 'AW-17608551252/T34CCPf6sqbENTtWmXb'});
            `,
          }}
        />
      </Head>

      {/* META PIXEL – PURCHASE EVENT */}
      <Script id="meta-purchase" strategy="afterInteractive">
        {`
          fbq('track', 'Purchase', {
            value: 0,
            currency: 'GBP'
          });
        `}
      </Script>

      <div style={{ padding: 40, textAlign: "center" }}>
        <h1>Payment Successful ✅</h1>
        <p>Your payment has been processed successfully.</p>
        <Link href="/student/dashboard">Go to Dashboard</Link>
      </div>
    </>
  );
}
