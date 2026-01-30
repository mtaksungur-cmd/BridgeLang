import Head from 'next/head';
import Link from 'next/link';
import styles from '../../scss/Privacy.module.scss';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | BridgeLang</title>
        <meta
          name="description"
          content="BridgeLang UK Ltd Privacy Policy — what personal data we collect, how we use it, legal bases (UK GDPR), retention, security, and your rights."
        />
        <meta name="robots" content="index,follow" />
      </Head>

      <main className={`container py-4 ${styles.legal}`}>
        <header className={styles.header}>
          <h1>Privacy Policy</h1>
          <p className={styles.sub}>
            <em>Last updated: 10 September 2025</em>
          </p>
        </header>

        {/* İçindekiler */}
        <aside className={styles.toc}>
          <h3>Contents</h3>
          <ol>
            <li><a href="#who-we-are">Who We Are</a></li>
            <li><a href="#scope">Scope and Applicability</a></li>
            <li><a href="#data-we-collect">Personal Data We Collect</a></li>
            <li><a href="#how-we-collect">How We Collect Data</a></li>
            <li><a href="#purposes">Purposes of Processing</a></li>
            <li><a href="#lawful-bases">Lawful Bases (UK GDPR)</a></li>
            <li><a href="#sharing">Data Sharing and Disclosure</a></li>
            <li><a href="#transfers">International Transfers</a></li>
            <li><a href="#retention">Retention</a></li>
            <li><a href="#security">Security</a></li>
            <li><a href="#children">Children and Young People</a></li>
            <li><a href="#automated">Automated Decision-Making</a></li>
            <li><a href="#rights">Data Subject Rights</a></li>
            <li><a href="#cookies">Cookies and Similar Technologies</a></li>
            <li><a href="#changes">Changes to This Policy</a></li>
            <li><a href="#contact">Contact, DPO and EU/EEA Representative</a></li>
          </ol>
        </aside>

        <article className={styles.article}>
          <section id="who-we-are">
            <h2>1. Who We Are</h2>
            <p>1.1 BridgeLang UK Ltd provides an online marketplace connecting independent teachers and students for language tuition delivered online and, where chosen by users, in person.</p>
            <p>
              1.2 <strong>Company number:</strong> 16555217 • <strong>Registered address:</strong> The Apex, Derriford Business Park, Brest Road, Plymouth, PL6 5FL, United Kingdom • <strong>Contact:</strong>{' '}
              <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>
            </p>
            <p>1.3 <strong>Role:</strong> BridgeLang UK Ltd is the data controller for personal data processed via the Platform.</p>
          </section>

          <section id="scope">
            <h2>2. Scope and Applicability</h2>
            <p>2.1 This Policy explains what personal data we collect, how and why we process it, the legal bases we rely on, how long we keep it, who we share it with, international transfers, your rights, and how to contact us.</p>
            <p>2.2 We process personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. Where applicable, we also comply with the EU GDPR for individuals located in the EEA.</p>
          </section>

          <section id="data-we-collect">
            <h2>3. Personal Data We Collect</h2>
            <ul>
              <li>3.1 <strong>Account &amp; Profile Data:</strong> name, email, password, language/region preferences, profile photo/bio.</li>
              <li>3.2 <strong>Student Data:</strong> bookings, lesson history, communications, feedback/ratings.</li>
              <li>3.3 <strong>Teacher Data:</strong> Application/Verification Details (e.g., identity/qualification information where lawful), availability, profile content, payout configuration (processed via our payment provider).</li>
              <li>3.4 <strong>Payment &amp; Transaction Data:</strong> payment status, timestamps, invoice/receipt data, limited card metadata (card brand/last four digits). Card details are processed by our payment provider (e.g., Stripe) and are not stored by BridgeLang.</li>
              <li>3.5 <strong>Usage &amp; Device Data:</strong> IP address, device/browser type, logs, diagnostics, and cookie data.</li>
              <li>3.6 <strong>Content You Provide:</strong> lesson materials, messages, reviews/testimonials, and optional social‑media contributions.</li>
              <li>3.7 <strong>In‑person Lesson Details:</strong> location information you choose to record for safety and any emergency contact details you store in your profile.</li>
              <li>3.8 <strong>Support &amp; Communications:</strong> emails and in‑app support messages.</li>
              <li>3.9 <strong>Special Category Data:</strong> BridgeLang does not seek to collect special category data (e.g., health information, racial or ethnic origin, religious beliefs). Please do not submit such data through the Platform. If such data is inadvertently provided, we will handle it strictly in accordance with applicable law and minimise processing.</li>
            </ul>
          </section>

          <section id="how-we-collect">
            <h2>4. How We Collect Data</h2>
            <ul>
              <li>4.1 Directly from you when you register, book, message, or contact support.</li>
              <li>4.2 Automatically through cookies and analytics when you use the Platform.</li>
              <li>4.3 From third parties (e.g., payment processors, identity/verification providers where used).</li>
            </ul>
          </section>

          <section id="purposes">
            <h2>5. Purposes of Processing</h2>
            <p>We use personal data to:</p>
            <ul>
              <li>5.1 Deliver and operate the Platform (accounts, matching, bookings, lessons, Credits).</li>
              <li>5.2 Process payments, refunds, chargebacks, and billing.</li>
              <li>5.3 Maintain trust and safety (fraud prevention, misuse detection, policy enforcement).</li>
              <li>5.4 Communicate with you (service notices, changes to terms, support).</li>
              <li>5.5 Improve the platform (performance, diagnostics, feature development).</li>
              <li>5.6 Conduct marketing with your consent where required.</li>
            </ul>
          </section>

          <section id="lawful-bases">
            <h2>6. Lawful Bases (UK GDPR)</h2>
            <p>Depending on the context, we rely on:</p>
            <ul>
              <li>6.1 <strong>Contract</strong> (to provide the services you request).</li>
              <li>6.2 <strong>Legitimate Interests</strong> (service safety and improvement, fraud prevention—balanced against your rights).</li>
              <li>6.3 <strong>Consent</strong> (e.g., marketing, non‑essential cookies).</li>
              <li>6.4 <strong>Legal Obligation</strong> (tax/accounting, AML/sanctions, lawful requests).</li>
            </ul>
          </section>

          <section id="sharing">
            <h2>7. Data Sharing and Disclosure</h2>
            <ul>
              <li>7.1 Data may be shared with trusted service providers (e.g., payment processors, hosting services).</li>
              <li>7.2 A list of current sub‑processors is available upon request by contacting <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>.</li>
              <li>7.3 Legal/Compliance: to comply with laws, enforce our Terms, protect rights/safety, or in connection with corporate transactions.</li>
              <li>7.4 We do not sell personal data.</li>
            </ul>
          </section>

          <section id="transfers">
            <h2>8. International Transfers</h2>
            <p>8.1 Where personal data is transferred outside the UK/EEA, we implement appropriate safeguards—such as the UK International Data Transfer Agreement (IDTA), the UK Addendum to the EU Standard Contractual Clauses (SCCs), adequacy decisions, or other approved mechanisms—to ensure an adequate level of protection.</p>
          </section>

          <section id="retention">
            <h2>9. Retention</h2>
            <ul>
              <li>9.1 We keep personal data only as long as necessary for the purposes described above and to meet legal, accounting, or reporting duties, after which we securely delete or anonymise it.</li>
              <li>9.2 Examples: Account data while active and for a reasonable period thereafter; Transaction records typically 6 years for accounting; Support communications per our retention schedule.</li>
            </ul>
          </section>

          <section id="security">
            <h2>10. Security</h2>
            <ul>
              <li>10.1 We implement appropriate technical and organisational measures to protect personal data against accidental or unlawful destruction, loss, alteration, unauthorised disclosure, or access.</li>
              <li>10.2 <strong>Data Breach Notification:</strong> In the unlikely event of a personal data breach likely to result in a risk to your rights and freedoms, we will notify the UK Information Commissioner’s Office (ICO) and, where required, affected individuals, in accordance with applicable law.</li>
            </ul>
          </section>

          <section id="children">
            <h2>11. Children and Young People</h2>
            <ul>
              <li>11.1 The Platform is intended for adults (18+).</li>
              <li>11.2 Students aged 14–17 may use the Platform only with prior written consent of a parent or legal guardian.</li>
              <li>11.3 We do not knowingly collect personal data from children under 14. If we learn we have collected such data without the required consent, we will delete it promptly.</li>
            </ul>
          </section>

          <section id="automated">
            <h2>12. Automated Decision‑Making</h2>
            <p>12.1 BridgeLang does not use personal data for automated decision‑making or profiling that produces legal or similarly significant effects.</p>
          </section>

          <section id="rights">
            <h2>13. Data Subject Rights</h2>
            <ul>
              <li>13.1 <strong>Right of Access</strong> – request confirmation and a copy of your data.</li>
              <li>13.2 <strong>Right to Rectification</strong> – correct inaccurate or incomplete data.</li>
              <li>
                13.3 <strong>Right to Erasure</strong>
                <ul>
                  <li>13.3.1 Requests under this Section 13 will be processed within thirty (30) days of receipt. We may extend this period by up to two (2) further months where requests are complex or numerous; if so, we will inform you of the extension and reasons.</li>
                  <li>13.3.2 BridgeLang may require verification of identity before fulfilling such requests to ensure data security.</li>
                </ul>
              </li>
              <li>13.4 <strong>Right to Restrict Processing</strong> – in certain circumstances (e.g., while accuracy is contested).</li>
              <li>13.5 <strong>Right to Object</strong> – to processing based on legitimate interests; and an absolute right to object to direct marketing.</li>
              <li>13.6 <strong>Right to Data Portability</strong> – receive your data in a commonly used format and transmit it to another controller where technically feasible.</li>
              <li>13.7 <strong>Right to Withdraw Consent</strong> – withdraw consent at any time (e.g., marketing or non‑essential cookies).</li>
              <li>13.8 <strong>How to Exercise Your Rights</strong> – contact <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>; we may need to verify identity.</li>
              <li>13.9 <strong>Complaints</strong> – you may lodge a complaint with the UK Information Commissioner’s Office (ICO) or your local data protection authority in the EEA.</li>
            </ul>
          </section>

          <section id="cookies">
            <h2>14. Cookies and Similar Technologies</h2>
            <ul>
              <li>14.1 Cookies are used to improve user experience.</li>
              <li>14.2 Users may adjust cookie preferences via their browser settings.</li>
              <li>14.3 You can manage your cookie preferences at any time via our cookie consent banner available on the website footer.</li>
              <li>14.4 For more details, please refer to our <Link href="/legal/cookie" className={styles.inlineLink}>Cookie Policy</Link>.</li>
            </ul>
          </section>

          <section id="changes">
            <h2>15. Changes to This Policy</h2>
            <p>15.1 We may update this Policy from time to time. The “Last updated” date will be revised accordingly. The latest version will be accessible via the Platform.</p>
          </section>

          <section id="contact">
            <h2>16. Contact, DPO and EU/EEA Representative</h2>
            <ul>
              <li>16.1 <strong>Contact:</strong> BridgeLang UK Ltd, The Apex, Derriford Business Park, Brest Road, Plymouth, PL6 5FL, United Kingdom • Email: <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a></li>
              <li>16.2 <strong>Data Protection Officer (DPO):</strong> BridgeLang has not appointed a DPO as we are not legally required to do so. For all data protection enquiries, please contact <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>.</li>
              <li>16.3 <strong>EU/EEA Representative (Article 27 GDPR):</strong> If and when BridgeLang offers services to individuals in the EEA in a manner that requires the appointment of an EU representative, we will designate such a representative and update this Policy with the relevant contact details.</li>
            </ul>
          </section>
        </article>
      </main>
    </>
  );
}
