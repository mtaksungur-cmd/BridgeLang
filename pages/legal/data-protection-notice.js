import Head from 'next/head';
import styles from '../../scss/DataProtectionNotice.module.scss';

export default function DataProtectionNotice() {
  return (
    <>
      <Head>
        <title>Data Protection Notice (UK GDPR) | BridgeLang</title>
        <meta
          name="description"
          content="How BridgeLang UK Ltd. processes personal data under UK GDPR: purposes, legal bases, retention, sharing, security, your rights, minors and parental consent."
        />
        <meta name="robots" content="index,follow" />
      </Head>

      <main className={`container py-4 ${styles.page}`} style={{ '--nav-height': '64px' }}>
        {/* Başlık */}
        <header className={styles.header}>
          <h1>Data Protection Notice <small>(UK GDPR)</small></h1>
          <p className={styles.subhead}>BridgeLang UK Ltd.</p>
          <p className={styles.lastUpdated}><em>Last Updated: 10 September 2025</em></p>
        </header>

        {/* İçindekiler (sol) */}
        <aside className={styles.toc} aria-label="Contents">
          <h3>Contents</h3>
          <ol>
            <li><a href="#s1">About This Notice</a></li>
            <li><a href="#s2">Controller and Contact</a></li>
            <li><a href="#s3">Personal Data We Process</a></li>
            <li><a href="#s4">Sources of Personal Data</a></li>
            <li><a href="#s5">Purposes and Legal Bases</a></li>
            <li><a href="#s6">Retention</a></li>
            <li><a href="#s7">Sharing and International Transfers</a></li>
            <li><a href="#s8">Security</a></li>
            <li><a href="#s9">Your Rights (UK GDPR)</a></li>
            <li><a href="#s10">Children and Safeguarding</a></li>
            <li><a href="#s11">Cookies and Similar Technologies</a></li>
            <li><a href="#s12">Automated Decision-Making</a></li>
            <li><a href="#s13">Complaints</a></li>
            <li><a href="#s14">Changes to This Notice</a></li>
          </ol>
        </aside>

        {/* Makale (sağ) */}
        <article className={styles.article}>
          <section id="s1">
            <h2>1. About This Notice</h2>
            <h3>1.1 Purpose</h3>
            <p>
              This Data Protection Notice explains how BridgeLang UK Ltd. (“BridgeLang”, “we”, “us”)
              processes personal data in line with the UK General Data Protection Regulation (“UK GDPR”)
              and applicable UK data protection laws.
            </p>
            <h3>1.2 Relationship to Other Policies</h3>
            <p>
              This Notice should be read together with our Privacy Policy and Cookie Policy. Where there
              is any inconsistency, the Privacy Policy prevails for matters of interpretation.
            </p>
            <h3>1.3 Who This Applies To</h3>
            <p>
              This Notice applies to all users of the Platform, including Students, Teachers, parents or
              guardians providing consent for minors, and website visitors.
            </p>
          </section>

          <section id="s2">
            <h2>2. Controller and Contact</h2>
            <h3>2.1 Controller</h3>
            <p>BridgeLang UK Ltd. is the data controller for personal data processed in connection with the Platform.</p>
            <h3>2.2 Registered Address</h3>
            <p>The Apex, Derriford Business Park, Brest Road, Plymouth, PL6 5FL, United Kingdom.</p>
            <h3>2.3 Data Protection Contact</h3>
            <p>
              Questions or requests may be sent to:
              {' '}<a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>.
              (BridgeLang is not currently required to appoint a Data Protection Officer; a dedicated contact is provided instead.)
            </p>
          </section>

          <section id="s3">
            <h2>3. Personal Data We Process</h2>
            <h3>3.1 Account and Identity Data</h3>
            <p>Name, email address, password, age/DoB (where relevant), country/region, preferred language.</p>
            <h3>3.2 Lesson and Communications Data</h3>
            <p>
              Booking details, lesson history, messages sent via the Platform, preferences and feedback.
              (Recording of lessons is not permitted without explicit consent, per the Terms.)
            </p>
            <h3>3.3 Payment and Billing Data</h3>
            <p>
              Payment method tokens, transaction references, refunds/chargebacks, and billing history
              processed via our payment processors (e.g., Stripe). (We do not store full card numbers.)
            </p>
            <h3>3.4 Technical and Usage Data</h3>
            <p>IP address, device/browser information, log data, cookie identifiers, pages viewed, session metadata (see Cookie Policy).</p>
            <h3>3.5 Teacher Vetting (Where Applicable)</h3>
            <p>Limited verification data necessary to confirm eligibility/identity, as notified at the time of collection.</p>
            <h3>3.6 Parental Consent Data (14–17)</h3>
            <p>Parent/guardian name and contact details, consent time-stamps and verification records.</p>
            <h3>3.7 Special Category Personal Data</h3>
            <p>We do not intentionally collect special category data (e.g., health, biometrics). Please do not share such data via the Platform.</p>
          </section>

          <section id="s4">
            <h2>4. Sources of Personal Data</h2>
            <h3>4.1 Directly from You</h3>
            <p>Information you provide when creating an account, booking lessons, or contacting us.</p>
            <h3>4.2 From Your Interactions on the Platform</h3>
            <p>Usage logs, bookings, messages, and support interactions.</p>
            <h3>4.3 From Service Providers</h3>
            <p>Payment processors, cloud hosting, analytics and email/SMS providers supplying service metadata.</p>
            <h3>4.4 Public or Third-Party Sources</h3>
            <p>Where appropriate and lawful, basic checks (e.g., eligibility) from public registers or trusted partners.</p>
          </section>

          <section id="s5">
            <h2>5. Purposes and Legal Bases</h2>
            <ul>
              <li><strong>5.1 Provide the Platform and Services</strong> — Legal basis: Contract (6(1)(b)).</li>
              <li><strong>5.2 Payments and Invoicing</strong> — Legal basis: Contract (6(1)(b)); Legitimate interests (6(1)(f)); Legal obligation (6(1)(c)).</li>
              <li><strong>5.3 Communications</strong> — Legal basis: Contract (6(1)(b)); Legitimate interests (6(1)(f)).</li>
              <li><strong>5.4 Safety, Security and Integrity</strong> — Legal basis: Legitimate interests (6(1)(f)); Legal obligation (6(1)(c)).</li>
              <li><strong>5.5 Product Improvement and Analytics</strong> — Legal basis: Legitimate interests (6(1)(f)); Consent for non-essential cookies (6(1)(a)).</li>
              <li><strong>5.6 Legal and Compliance</strong> — Legal basis: Legal obligation (6(1)(c)).</li>
              <li><strong>5.7 Marketing (Optional)</strong> — Legal basis: Consent (6(1)(a)).</li>
              <li><strong>5.8 Minors and Parental Consent</strong> — Legal basis: Legal obligation (6(1)(c)); Legitimate interests (6(1)(f)); Consent (6(1)(a)).</li>
            </ul>
          </section>

          <section id="s6">
            <h2>6. Retention</h2>
            <h3>6.1 Principles</h3>
            <p>We keep personal data no longer than necessary for the purposes set out in this Notice.</p>
            <h3>6.2 Indicative Periods</h3>
            <ul>
              <li>Account and booking data: for the life of the account and then up to six (6) years for tax and record-keeping.</li>
              <li>Support tickets and messages: typically up to 24 months after closure.</li>
              <li>Security and access logs: typically 12 months from collection.</li>
              <li>Marketing preferences: until you opt out or the data becomes inactive.</li>
              <li>Parental consent records: retained for as long as necessary and thereafter securely deleted or anonymised in accordance with the Privacy Policy.</li>
            </ul>
          </section>

          <section id="s7">
            <h2>7. Sharing and International Transfers</h2>
            <h3>7.1 Recipients (Categories)</h3>
            <p>Payment processors, hosting and cloud providers, analytics, communications and support tools, professional advisers, and regulators/law enforcement where required.</p>
            <h3>7.2 Processors vs. Independent Controllers</h3>
            <p>Some providers act as processors under our instructions; others (e.g., payment providers) act as independent controllers.</p>
            <h3>7.3 International Transfers</h3>
            <p>
              Where data is transferred outside the UK/EEA, we use safeguards such as IDTA or UK Addendum to EU SCCs plus transfer risk assessments.
              Where transfers are to countries covered by UK adequacy regulations, we rely on that adequacy.
            </p>
            <h3>7.4 Further Information</h3>
            <p>Details of specific transfers and safeguards are available upon request.</p>
          </section>

          <section id="s8">
            <h2>8. Security</h2>
            <h3>8.1 Measures</h3>
            <p>We implement encryption, access controls, data minimisation, secure development practices, and staff confidentiality.</p>
            <h3>8.2 Incident Response</h3>
            <p>We will notify you and/or the ICO of a personal data breach where required by law.</p>
            <h3>8.3 Your Responsibilities</h3>
            <p>Use strong passwords; keep credentials confidential; report suspected misuse to <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>.</p>
          </section>

          <section id="s9">
            <h2>9. Your Rights (UK GDPR)</h2>
            <h3>9.1 Data Subject Rights</h3>
            <p>Access; rectification; erasure; restriction; portability; objection; withdrawal of consent.</p>
            <h3>9.2 How to Exercise</h3>
            <p>Submit requests to <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>. Verification of identity may be required.</p>
            <h3>9.3 Fees and Timing</h3>
            <p>Requests are ordinarily free. We aim to respond within one (1) month (extendable where permitted).</p>
          </section>

          <section id="s10">
            <h2>10. Children and Safeguarding</h2>
            <h3>10.1 Age Thresholds</h3>
            <p>Students aged fourteen (14) – seventeen (17) may participate only with verified parent or guardian consent.</p>
            <h3>10.2 Verification and Ongoing Checks</h3>
            <p>BridgeLang may request proof of parental consent at any time and suspend accounts if consent cannot be verified.</p>
            <h3>10.3 Direct Contact Details</h3>
            <p>Teachers and Students must not exchange personal contact details to arrange off-Platform lessons or payments.</p>
          </section>

          <section id="s11">
            <h2>11. Cookies and Similar Technologies</h2>
            <h3>11.1 Cookies</h3>
            <p>We use essential cookies and, with consent, analytics/functional cookies. See Cookie Policy.</p>
          </section>

          <section id="s12">
            <h2>12. Automated Decision-Making</h2>
            <h3>12.1 No Solely Automated Decisions</h3>
            <p>BridgeLang does not make decisions solely by automated processing that have legal or similarly significant effects.</p>
          </section>

          <section id="s13">
            <h2>13. Complaints</h2>
            <h3>13.1 Contact Us First</h3>
            <p>Please contact <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a> and we will seek to resolve concerns.</p>
            <h3>13.2 ICO</h3>
            <p>You have the right to lodge a complaint with the Information Commissioner’s Office (ICO).</p>
          </section>

          <section id="s14">
            <h2>14. Changes to This Notice</h2>
            <h3>14.1 Updates</h3>
            <p>We may update this Notice. Material changes will be highlighted and the Last Updated date revised.</p>
          </section>
        </article>
      </main>
    </>
  );
}
