import Head from 'next/head';
import styles from '../../scss/DisclaimerPolicy.module.scss';

export default function DisclaimerPolicy() {
  return (
    <>
      <Head>
        <title>Disclaimer Policy | BridgeLang</title>
        <meta
          name="description"
          content="BridgeLang Disclaimer Policy: educational purpose only, no guarantees of results, independent teachers, limitation of liability, external links, governing law, and contact details."
        />
        <meta name="robots" content="index,follow" />
      </Head>

      <main className={`container py-4 ${styles.legal}`} style={{ '--nav-height': '64px' }}>
        <header className={styles.header}>
          <h1>Disclaimer Policy – BridgeLang UK Ltd.</h1>
          <p className={styles.sub}><em>Last Updated: 10 September 2025</em></p>
        </header>

        {/* Desktop’ta sticky, mobilde normal liste */}
        <aside className={styles.toc} aria-label="Contents">
          <h3>Contents</h3>
          <ol>
            <li><a href="#intro">Introduction</a></li>
            <li><a href="#educational">Educational Purpose Only</a></li>
            <li><a href="#results">No Guarantee of Results</a></li>
            <li><a href="#thirdparty">Third-Party Responsibility</a></li>
            <li><a href="#liability">Limitation of Liability</a></li>
            <li><a href="#links">External Links</a></li>
            <li><a href="#law">Governing Law</a></li>
            <li><a href="#contact">Contact Information</a></li>
            <li><a href="#changes">Changes to This Policy</a></li>
          </ol>
        </aside>

        <article className={styles.article}>
          <section id="intro">
            <h2>1. Introduction</h2>
            <h3>1.1 Scope and Purpose.</h3>
            <p>
              This Disclaimer Policy (“Policy”) sets out the limitations of liability and scope of responsibility for
              BridgeLang UK Ltd (“BridgeLang,” “we,” “us,” or “our”) in relation to the use of our online language learning
              platform (the “Platform”).
            </p>
            <h3>1.2 Acceptance.</h3>
            <p>
              By using our website and services, you acknowledge and agree to the terms outlined in this Policy.
            </p>
          </section>

          <section id="educational">
            <h2>2. Educational Purpose Only</h2>
            <h3>2.1 Platform Role.</h3>
            <p>BridgeLang provides the Platform for connecting students and teachers for the purpose of language learning.</p>
            <h3>2.2 Educational Use Only.</h3>
            <p>All content and lessons delivered through the Platform are intended solely for educational purposes.</p>
            <h3>2.3 No Professional Advice.</h3>
            <p>
              BridgeLang does not provide legal, financial, medical, or professional advisory services. Any reliance on such
              information provided by teachers or other users is strictly at your own risk.
            </p>
          </section>

          <section id="results">
            <h2>3. No Guarantee of Results</h2>
            <h3>3.1 No Promises or Warranties of Outcome.</h3>
            <p>
              BridgeLang does not warrant or guarantee any specific learning outcomes, exam success, academic achievement,
              or professional advancement as a result of using the Platform.
            </p>
            <h3>3.2 Individual Factors.</h3>
            <p>Student progress depends on personal effort, commitment, and individual circumstances.</p>
          </section>

          <section id="thirdparty">
            <h2>4. Third-Party Responsibility</h2>
            <h3>4.1 Independent Teachers.</h3>
            <p>
              All teachers registered on BridgeLang operate as independent contractors and are not employees or
              representatives of BridgeLang.
            </p>
            <h3>4.2 Teacher-Provided Content.</h3>
            <p>
              BridgeLang is not responsible for the accuracy, reliability, legality, or appropriateness of any content,
              advice, or materials provided by teachers.
            </p>
            <h3>4.3 Teacher–Student Relationship.</h3>
            <p>Any agreements, disputes, or interactions between students and teachers remain solely between those parties.</p>
          </section>

          <section id="liability">
            <h2>5. Limitation of Liability</h2>
            <h3>5.1 Exclusions of Damages.</h3>
            <p>To the maximum extent permitted by law, BridgeLang shall not be held liable for:</p>
            <ul>
              <li>(a) any direct, indirect, incidental, consequential, or punitive damages arising from the use or inability to use the Platform;</li>
              <li>(b) loss of profits, data, or opportunities resulting from reliance on lessons, content, or teacher services;</li>
              <li>(c) any technical failures, interruptions, errors, or security breaches beyond our reasonable control.</li>
            </ul>
            <h3>5.2 Non-Excludable Liabilities.</h3>
            <p>Nothing in this Policy excludes or limits liability for fraud, fraudulent misrepresentation, or any liability which cannot be excluded under applicable law.</p>
            <h3>5.3 Statutory Rights.</h3>
            <p>Nothing in this Policy affects your non-waivable statutory rights under applicable consumer protection law.</p>
          </section>

          <section id="links">
            <h2>6. External Links</h2>
            <h3>6.1 Third-Party Sites.</h3>
            <p>The BridgeLang website may contain links to external websites or third-party resources.</p>
            <h3>6.2 No Endorsement or Control.</h3>
            <p>
              BridgeLang does not endorse, control, or assume responsibility for the content, availability, or practices of such
              third-party sites.
            </p>
            <h3>6.3 Access at Your Own Risk.</h3>
            <p>
              Accessing external links is at your own discretion and risk. You should review the applicable terms and privacy policies
              of any third-party websites you visit.
            </p>
          </section>

          <section id="law">
            <h2>7. Governing Law</h2>
            <h3>7.1 Law of England &amp; Wales.</h3>
            <p>This Policy is governed by and construed in accordance with the laws of England and Wales.</p>
            <h3>7.2 Courts of England &amp; Wales.</h3>
            <p>Any disputes arising in connection with this Policy shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </section>

          <section id="contact">
            <h2>8. Contact Information</h2>
            <h3>8.1 Contact Details.</h3>
            <address>
              BridgeLang UK Ltd<br/>
              The Apex, Derriford Business Park<br/>
              Brest Road, Plymouth, PL6 5FL<br/>
              United Kingdom<br/>
              Email: <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>
            </address>
          </section>

          <section id="changes">
            <h2>9. Changes to This Policy</h2>
            <h3>9.1 Updates and Revisions.</h3>
            <p>
              BridgeLang may update or revise this Disclaimer Policy from time to time to reflect changes in our practices,
              services, or legal requirements.
            </p>
            <h3>9.2 Publication of Changes.</h3>
            <p>Any changes will be posted on this page with the “Last Updated” date revised accordingly.</p>
            <h3>9.3 User Responsibility to Review.</h3>
            <p>We encourage you to review this Policy periodically to stay informed about how it applies to your use of our platform.</p>
          </section>
        </article>
      </main>
    </>
  );
}
