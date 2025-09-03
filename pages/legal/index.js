import Head from 'next/head';
import Link from 'next/link';

export default function LegalHub() {
  return (
    <>
      <Head>
        <title>Legal Hub | BridgeLang</title>
        <meta name="description" content="All BridgeLang legal policies in one place." />
      </Head>

      <main className="container py-5">
        <h1 className="h3 fw-bold mb-3">Legal Hub</h1>
        <p className="text-muted mb-4">
          Find all our terms, policies and notices in one place.
        </p>

        <div className="row g-3">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="border rounded-3 p-3 h-100">
              <h2 className="h6 fw-bold mb-2">Core</h2>
              <ul className="mb-0 ps-3">
                <li><Link href="/legal/terms">Terms of Use</Link></li>
                <li><Link href="/legal/privacy">Privacy Policy</Link></li>
                <li><Link href="/legal/cookie">Cookie Policy</Link></li>
                <li><Link href="/legal/refund">Refund &amp; Cancellation</Link></li>
              </ul>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-4">
            <div className="border rounded-3 p-3 h-100">
              <h2 className="h6 fw-bold mb-2">Content & IP</h2>
              <ul className="mb-0 ps-3">
                <li><Link href="/legal/copyright">Copyright &amp; IP Policy</Link></li>
                <li><Link href="/legal/acceptable-use">Acceptable Use Policy</Link></li>
                <li><Link href="/legal/community-guidelines">Community Guidelines &amp; Code of Conduct</Link></li>
                <li><Link href="/legal/disclaimer">In-Person Lesson Disclaimer</Link></li>
              </ul>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-4">
            <div className="border rounded-3 p-3 h-100">
              <h2 className="h6 fw-bold mb-2">Privacy & Compliance</h2>
              <ul className="mb-0 ps-3">
                <li><Link href="/legal/data-protection-notice">Data Protection Notice (UK GDPR)</Link></li>
                <li><Link href="/legal/parental-consent">Parental Consent Policy</Link></li>
                <li><Link href="/legal/accessibility">Accessibility Note</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
