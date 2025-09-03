import Head from 'next/head';
import styles from '../../scss/AcceptableUsePolicy.module.scss';

export default function AcceptableUsePolicy() {
  return (
    <>
      <Head>
        <title>Acceptable Use Policy | BridgeLang</title>
        <meta
          name="description"
          content="BridgeLang Acceptable Use Policy (AUP): account integrity, prohibited conduct, security, payments, content standards, safeguarding, reporting, enforcement and more."
        />
        <meta name="robots" content="index,follow" />
      </Head>

      <main className={`container py-4 ${styles.page}`} style={{ '--nav-height': '64px' }}>
        {/* Başlık */}
        <header className={styles.header}>
          <h1>Acceptable Use Policy — BridgeLang UK Ltd.</h1>
          <p className={styles.lastUpdated}><em>Last Updated: 10 September 2025</em></p>
        </header>

        {/* İçindekiler */}
        <aside className={styles.toc} aria-label="Contents">
          <h3>Contents</h3>
          <ol>
            <li><a href="#s1">Purpose and Scope</a></li>
            <li><a href="#s2">Account Integrity and Eligibility</a></li>
            <li><a href="#s3">Prohibited Conduct (High-Level)</a></li>
            <li><a href="#s4">Security, Systems, and Network</a></li>
            <li><a href="#s5">Payments and Off-Platform Conduct</a></li>
            <li><a href="#s6">Content Standards and Intellectual Property</a></li>
            <li><a href="#s7">Communications and Professional Conduct</a></li>
            <li><a href="#s8">Minors and Safeguarding (14–17)</a></li>
            <li><a href="#s9">In-Person Lessons</a></li>
            <li><a href="#s10">Reporting Violations and Takedown</a></li>
            <li><a href="#s11">Monitoring and Moderation</a></li>
            <li><a href="#s12">Enforcement and Consequences</a></li>
            <li><a href="#s13">Relationship to Other Policies</a></li>
            <li><a href="#s14">Changes to This AUP</a></li>
            <li><a href="#s15">Contact</a></li>
          </ol>
        </aside>

        {/* Makale */}
        <article className={styles.article}>
          <section id="s1">
            <h2>1. Purpose and Scope</h2>
            <p><strong>1.1 Scope and Relationship to Terms.</strong> This Acceptable Use Policy (“AUP”) sets the rules for use of the BridgeLang online language education platform (the “Platform”) and applies to all Users, including Students and Teachers. This AUP forms part of the Terms of Use; in the event of conflict, the Terms of Use prevail.</p>
            <p><strong>1.2 Capitalised Terms.</strong> Capitalised terms not defined here have the meanings given in the Terms of Use.</p>
          </section>

          <section id="s2">
            <h2>2. Account Integrity and Eligibility</h2>
            <p><strong>2.1 Eligibility.</strong> Users must meet the eligibility criteria set out in the Terms of Use (generally 18+ and UK-resident; 14–17 only with verified parental/guardian consent).</p>
            <p><strong>2.2 Accurate Information and Single Account.</strong> You must provide accurate information and maintain only one account unless BridgeLang expressly permits otherwise.</p>
            <p><strong>2.3 Credentials and Security.</strong> You are responsible for safeguarding your login credentials and for all activity under your account.</p>
            <p><strong>2.4 Notification of Misuse.</strong> Notify BridgeLang promptly of any unauthorised access or suspected compromise of your account.</p>
          </section>

          <section id="s3">
            <h2>3. Prohibited Conduct (High-Level)</h2>
            <p><strong>3.1 Circumvention and Off-Platform Activity.</strong></p>
            <ul>
              <li><strong>3.1.1</strong> Do not circumvent the Platform’s booking or payment systems, including arranging lessons or payments off-Platform.</li>
              <li><strong>3.1.2</strong> Do not share personal contact details for the purpose of moving lessons or transactions off-Platform.</li>
            </ul>
            <p><strong>3.2 Unlawful, Harmful, or Abusive Content.</strong></p>
            <ul>
              <li><strong>3.2.1</strong> No harassment, hate speech, discrimination, defamation, threats, or unlawful content.</li>
              <li><strong>3.2.2</strong> Do not upload content that violates privacy, publicity, or other third-party rights.</li>
            </ul>
            <p><strong>3.3 Intellectual Property Infringement.</strong></p>
            <ul>
              <li><strong>3.3.1</strong> Do not upload or distribute content without appropriate rights.</li>
              <li><strong>3.3.2</strong> Respect copyright notices and do not remove rights-management information.</li>
            </ul>
            <p><strong>3.4 Recording Without Consent.</strong> Recording lessons without the explicit consent of all parties is prohibited.</p>
            <p><strong>3.5 Spam, Data Harvesting, and Misuse of Messaging.</strong></p>
            <ul>
              <li><strong>3.5.1</strong> No spamming, mass messages, or unsolicited promotions.</li>
              <li><strong>3.5.2</strong> No scraping, mining, or harvesting of user data or Platform content.</li>
            </ul>
            <p><strong>3.6 Impersonation and Misrepresentation.</strong> Do not impersonate others or misrepresent your identity, qualifications, or affiliations.</p>
          </section>

          <section id="s4">
            <h2>4. Security, Systems, and Network</h2>
            <p><strong>4.1 No Malicious Activity.</strong> No malware, unauthorised access, probing, scanning, stress-testing, or disrupting the Platform or its infrastructure.</p>
            <p><strong>4.2 Automated Scraping and Bulk Download.</strong> Automated scraping, bulk download, or screen-scraping of content or data is prohibited.</p>
            <p><strong>4.3 Text and Data Mining / AI Training.</strong> Using Platform or Teacher content to train, fine-tune, or evaluate AI/ML models, or for TDM, is prohibited unless expressly authorised in writing or mandated by applicable law.</p>
            <p><strong>4.4 Vulnerability Reporting.</strong> Report suspected security issues to <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>; do not publicly disclose without permission.</p>
            <p><strong>4.5 Resource Abuse and Rate Limiting.</strong> You must not engage in activity that imposes an unreasonable load on the Platform (including automated account creation, excessive requests, bulk messaging, or large-scale file transfers) or otherwise interferes with its normal operation.</p>
          </section>

          <section id="s5">
            <h2>5. Payments and Off-Platform Conduct</h2>
            <p><strong>5.1 Booking and Payments.</strong> All lessons must be booked and paid for through the Platform in accordance with the Terms of Use and applicable policies.</p>
            <p><strong>5.2 Cancellation and Abuse.</strong> Repeated late cancellations, no-shows, or similar abuse of scheduling may result in enforcement action.</p>
            <p><strong>5.3 Solicitation Restriction.</strong> Do not solicit Students or Teachers for off-Platform lessons or for competing services.</p>
            <p><strong>5.4 Fraud and Chargebacks.</strong> Fraudulent payments, unauthorised card use, or chargeback abuse may result in account action (including suspension or termination) and recovery of amounts owed.</p>
          </section>

          <section id="s6">
            <h2>6. Content Standards and Intellectual Property</h2>
            <p><strong>6.1 Teacher Materials (Ownership).</strong> Unless otherwise agreed, Teacher-created lesson materials remain the Teacher’s intellectual property.</p>
            <p><strong>6.2 Student Licence (On-Platform Only).</strong> Students receive a personal, non-transferable licence to use Teacher materials for on-Platform learning only; downloading, redistributing, or publishing outside the Platform is prohibited unless permitted by the Teacher.</p>
            <p><strong>6.3 Rights Warranty and Clearances.</strong> You warrant that you own or control the necessary rights for content you upload and will provide evidence of permission on request.</p>
            <p><strong>6.4 Privacy and Confidentiality.</strong> Do not post or share others’ personal or confidential information without authority.</p>
            <p><strong>6.5 Prohibited Materials.</strong> No unlawful materials, child sexual abuse material, extremist propaganda, or content that incites violence or self-harm.</p>
            <p><strong>6.6 Moderation Rights.</strong> BridgeLang may review, moderate, remove, or disable content to enforce this AUP and the Terms of Use.</p>
          </section>

          <section id="s7">
            <h2>7. Communications and Professional Conduct</h2>
            <p><strong>7.1 Professional Standards.</strong> Teachers and Students must maintain respectful, professional behaviour.</p>
            <p><strong>7.2 No Harassment or Inappropriate Advances.</strong> Sexual or romantic advances, harassment, and hate speech are strictly prohibited.</p>
            <p><strong>7.3 Lesson-Related Use Only.</strong> Use Platform messaging solely for lesson-related purposes; no spam or unrelated promotions.</p>
          </section>

          <section id="s8">
            <h2>8. Minors and Safeguarding (14–17)</h2>
            <p><strong>8.1 Parental/Guardian Consent.</strong> Students aged 14–17 may use the Platform only with verified parental/guardian consent and in accordance with safeguarding measures notified by BridgeLang.</p>
            <p><strong>8.2 Teacher Responsibilities.</strong> Teachers must comply with any additional safeguarding or vetting requirements communicated by BridgeLang.</p>
            <p><strong>8.3 Safeguarding Measures.</strong> BridgeLang implements measures to protect minors and ensure compliance with applicable safeguarding obligations.</p>
            <p><strong>8.4 Verification of Consent.</strong> BridgeLang reserves the right to request proof of parental or guardian consent at any time. Failure to provide such proof may result in suspension or termination of the account.</p>
            <p><strong>8.5 Reporting Concerns.</strong> Report any safeguarding concerns immediately to <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>.</p>
          </section>

          <section id="s9">
            <h2>9. In-Person Lessons</h2>
            <p><strong>9.1 Risk and Safety.</strong> In-person meetings are undertaken at the risk of both Teacher and Student; follow safety recommendations (e.g., meeting in public spaces, sharing lesson location with a trusted contact).</p>
            <p><strong>9.2 Minors.</strong> For first meetings with a minor, consider a parent/guardian’s presence and comply with safeguarding guidance.</p>
            <p><strong>9.3 Insurance.</strong> Teachers are responsible for maintaining appropriate public liability insurance where applicable.</p>
            <p><strong>9.4 Cash Handling.</strong> No cash or off-Platform payments may be exchanged during in-person lessons; all payments must be processed through the Platform.</p>
          </section>

          <section id="s10">
            <h2>10. Reporting Violations and Takedown</h2>
            <p><strong>10.1 How to Report.</strong> Report AUP or IP violations to <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a> with sufficient detail to identify the user, content, and issue.</p>
            <p><strong>10.2 Interim Measures.</strong> BridgeLang may remove/disable content or restrict access while a report is assessed and may request further information.</p>
            <p><strong>10.3 Counter-Notice (IP).</strong> Where IP is involved, BridgeLang may provide a counter-notice route to the uploader consistent with applicable law and our IP policy.</p>
            <p><strong>10.4 Abusive or Bad-Faith Reports.</strong> Submitting fraudulent, bad-faith, or abusive reports may result in account action.</p>
          </section>

          <section id="s11">
            <h2>11. Monitoring and Moderation</h2>
            <p><strong>11.1 Monitoring.</strong> BridgeLang may monitor, review, and moderate activity and content to enforce this AUP and the Terms of Use.</p>
            <p><strong>11.2 Privacy Note.</strong> Monitoring is conducted in accordance with applicable law and our Privacy Policy.</p>
          </section>

          <section id="s12">
            <h2>12. Enforcement and Consequences</h2>
            <p><strong>12.1 Progressive Enforcement.</strong> BridgeLang may apply progressive measures (warnings, feature limits, temporary suspension, termination) and may terminate immediately for serious misconduct.</p>
            <p><strong>12.2 Additional Measures.</strong> Consequences may include withholding payouts, removing listings from search, cancelling lessons, or other steps described in the Terms of Use.</p>
            <p><strong>12.3 Legal and Regulatory Compliance.</strong> BridgeLang may take actions necessary to comply with sanctions, AML, and other legal obligations.</p>
            <p><strong>12.4 Appeals.</strong></p>
            <ul>
              <li><strong>12.4.1</strong> If your account is restricted or your content removed, you may submit a written appeal within fourteen (14) days to <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>.</li>
              <li><strong>12.4.2</strong> BridgeLang will review the appeal at its discretion and respond within 30 days.</li>
            </ul>
          </section>

          <section id="s13">
            <h2>13. Relationship to Other Policies</h2>
            <p><strong>13.1 Incorporated Policies.</strong> Read this AUP together with the Terms of Use, Privacy Policy, Cookie Policy, Refund &amp; Cancellation Policy, and Copyright &amp; IP Policy.</p>
            <p><strong>13.2 Order of Precedence.</strong> If there is any inconsistency, the Terms of Use prevail.</p>
          </section>

          <section id="s14">
            <h2>14. Changes to This AUP</h2>
            <p><strong>14.1 Updates and Revisions.</strong> BridgeLang may update this AUP from time to time to reflect changes in practices, services, or legal requirements.</p>
            <p><strong>14.2 Publication of Changes.</strong> Any changes take effect upon posting, with the “Last Updated” date revised accordingly.</p>
            <p><strong>14.3 User Responsibility to Review.</strong> Please review this AUP periodically to stay informed about how it applies to your use of the Platform.</p>
          </section>

          <section id="s15">
            <h2>15. Contact</h2>
            <p><strong>15.1 Contact Details.</strong> Questions or reports under this AUP: <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>. Registered company details are listed in the Terms of Use.</p>
          </section>
        </article>
      </main>
    </>
  );
}
