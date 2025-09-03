import Head from 'next/head';
import styles from '../../scss/ParentalConsent.module.scss';

export default function ParentalConsentPolicy() {
  return (
    <>
      <Head>
        <title>Parental Consent Policy | BridgeLang</title>
        <meta
          name="description"
          content="BridgeLang Parental Consent Policy — minors (14–17) require verified parent/guardian consent before account activation."
        />
        <meta name="robots" content="index,follow" />
      </Head>

      <main className={`container py-4 ${styles.page}`} style={{ '--nav-height': '64px' }}>
        {/* Başlık */}
        <header className={styles.header}>
          <h1>Parental Consent Policy</h1>
          <p className={styles.lastUpdated}><em>Last Updated: 10 September 2025</em></p>
        </header>

        {/* İçindekiler */}
        <aside className={styles.toc} aria-label="Contents">
          <h3>Contents</h3>
          <ol>
            <li><a href="#s1">Introduction</a></li>
            <li><a href="#s2">Eligibility</a></li>
            <li><a href="#s3">Parental Consent Requirement</a></li>
            <li><a href="#s4">Verification of Consent</a></li>
            <li><a href="#s5">Rights and Responsibilities</a></li>
            <li><a href="#s6">Withdrawal of Consent</a></li>
            <li><a href="#s7">Data Protection</a></li>
            <li><a href="#s8">Updates to This Policy</a></li>
            <li><a href="#s9">Contact Us</a></li>
          </ol>
        </aside>

        {/* Makale */}
        <article className={styles.article}>
          <section id="s1">
            <h2>1. Introduction</h2>

            <h3>1.1 Purpose</h3>
            <p>
              This Parental Consent Policy explains how BridgeLang requires and manages parental or guardian
              consent for students aged between fourteen (14) and seventeen (17) years before they can create
              an account or access lessons.
            </p>

            <h3>1.2 Commitment</h3>
            <p>
              BridgeLang is committed to ensuring the safety, privacy, and lawful participation of minors in
              compliance with applicable laws in the United Kingdom.
            </p>
          </section>

          <section id="s2">
            <h2>2. Eligibility</h2>

            <h3>2.1 Minimum Age</h3>
            <p>Students must be at least 14 years old to use the Platform.</p>

            <h3>2.2 Consent Requirement</h3>
            <p>Students under the age of 18 must provide verified parental or guardian consent prior to account activation.</p>

            <h3>2.3 Prohibited Registration</h3>
            <p>Students younger than 14 are not permitted to register or use the Platform under any circumstances.</p>
          </section>

          <section id="s3">
            <h2>3. Parental Consent Requirement</h2>

            <h3>3.1 Confirmation Emails</h3>
            <p>
              Both the student and their parent/guardian will receive separate confirmation emails upon registration.
            </p>

            <h3>3.2 Activation Conditions</h3>
            <ol>
              <li>3.2.1 The student confirms their registration; and</li>
              <li>3.2.2 The parent/guardian provides explicit consent.</li>
            </ol>
            <p>Until both conditions are satisfied, the student’s account remains inactive.</p>

            <h3>3.3 Expiration of Request</h3>
            <p>
              If parental consent is not received within seven (7) days, the student’s registration request will
              be automatically deleted.
            </p>

            <h3>3.4 Scope of Consent</h3>
            <p>
              Parental/guardian consent covers the minor’s participation in lessons conducted on the Platform and any
              in-person lessons arranged through the Platform, subject to BridgeLang’s safeguarding measures and applicable policies.
            </p>
          </section>

          <section id="s4">
            <h2>4. Verification of Consent</h2>

            <h3>4.1 Proof of Guardianship</h3>
            <p>Parents or guardians may be asked to provide proof of identity or guardianship if required.</p>

            <h3>4.2 Right to Request</h3>
            <p>
              BridgeLang reserves the right to request proof of parental consent at any time during the student’s use of the Platform.
            </p>

            <h3>4.3 Verification Methods</h3>
            <p>
              BridgeLang may verify consent through separate confirmation emails, time-stamped consent logs, and, where
              proportionate, identity or guardianship checks (e.g., a brief declaration or supporting documentation).
              BridgeLang may refuse or revoke access if verification cannot be completed.
            </p>
          </section>

          <section id="s5">
            <h2>5. Rights and Responsibilities</h2>

            <h3>5.1 Student Responsibilities</h3>
            <ol>
              <li>5.1.1 Provide accurate registration details.</li>
              <li>5.1.2 Follow platform rules and behave appropriately during lessons.</li>
            </ol>

            <h3>5.2 Parent/Guardian Responsibilities</h3>
            <ol>
              <li>5.2.1 Ensure safe and responsible use of the Platform.</li>
              <li>5.2.2 Monitor the student’s participation where appropriate.</li>
              <li>5.2.3 Inform BridgeLang if consent is to be withdrawn.</li>
            </ol>
          </section>

          <section id="s6">
            <h2>6. Withdrawal of Consent</h2>

            <h3>6.1 Process</h3>
            <p>
              Parents or guardians may withdraw consent at any time by contacting BridgeLang at{' '}
              <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>.
            </p>

            <h3>6.2 Effect</h3>
            <p>
              Once consent is withdrawn, the student’s account will be suspended or deleted, and no further lessons may be booked.
            </p>

            <h3>6.3 Transition at Age 18</h3>
            <p>
              When the Student turns eighteen (18), parental/guardian consent is no longer required. Continued use of the Platform
              is subject to the Student’s own acceptance of the Terms of Use and applicable policies.
            </p>
          </section>

          <section id="s7">
            <h2>7. Data Protection</h2>

            <h3>7.1 Legal Basis</h3>
            <p>
              All personal data collected during the consent process will be handled in line with the BridgeLang Privacy Policy and UK GDPR.
            </p>

            <h3>7.2 Use of Parental Data</h3>
            <p>Parental details will be used only for consent verification and related communications.</p>

            <h3>7.3 Retention of Consent Records</h3>
            <p>
              BridgeLang retains parental/guardian consent records for as long as necessary to administer the Student’s account and
              comply with legal obligations, and thereafter securely deletes or anonymises such records in accordance with the Privacy Policy.
            </p>

            <h3>7.4 Parental Data Rights</h3>
            <p>
              Parents/guardians may exercise UK GDPR rights (e.g., access, rectification, erasure, restriction, objection) regarding their own
              contact details and consent records as described in the Privacy Policy. Requests can be sent to{' '}
              <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>.
            </p>
          </section>

          <section id="s8">
            <h2>8. Updates to This Policy</h2>

            <h3>8.1 Policy Changes</h3>
            <p>BridgeLang may update or revise this Policy to reflect changes in practices, services, or legal requirements.</p>

            <h3>8.2 Notification</h3>
            <p>Any changes will be posted here with the “Last Updated” date revised accordingly.</p>

            <h3>8.3 Responsibility</h3>
            <p>Parents/guardians should review this Policy periodically.</p>
          </section>

          <section id="s9">
            <h2>9. Contact Us</h2>

            <h3>9.1 Registered Details</h3>
            <p>
              BridgeLang UK Ltd., The Apex, Derriford Business Park, Brest Road, Plymouth, PL6 5FL, United Kingdom.
            </p>

            <h3>9.2 Contact Email</h3>
            <p>
              <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>
            </p>
          </section>
        </article>
      </main>
    </>
  );
}
