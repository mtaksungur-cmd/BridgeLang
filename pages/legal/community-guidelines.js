import Head from 'next/head';
import styles from '../../scss/CommunityGuidelines.module.scss';

export default function CommunityGuidelines() {
  return (
    <>
      <Head>
        <title>Community Guidelines & Code of Conduct | BridgeLang</title>
        <meta
          name="description"
          content="BridgeLang community guidelines and code of conduct for respectful, safe, and professional use of the platform by Students and Teachers."
        />
        <meta name="robots" content="index,follow" />
      </Head>

      <main className={`container py-4 ${styles.page}`} style={{ '--nav-height': '64px' }}>
        {/* Başlık */}
        <header className={styles.header}>
          <h1>Community Guidelines and Code of Conduct</h1>
          <p className={styles.lastUpdated}>
            <em>Last Updated: 10 September 2025</em>
          </p>
        </header>

        {/* İçindekiler */}
        <aside className={styles.toc} aria-label="Contents">
          <h3>Contents</h3>
          <ol>
            <li><a href="#s1">Introduction</a></li>
            <li><a href="#s2">Respectful Communication</a></li>
            <li><a href="#s3">Inclusivity and Equal Treatment</a></li>
            <li><a href="#s4">Lesson Conduct</a></li>
            <li><a href="#s5">Platform Integrity</a></li>
            <li><a href="#s6">Safety and Safeguarding</a></li>
            <li><a href="#s7">Community Contributions</a></li>
            <li><a href="#s8">Enforcement</a></li>
            <li><a href="#s9">Updates to These Guidelines</a></li>
            <li><a href="#s10">Related Policies</a></li>
          </ol>
        </aside>

        {/* Makale */}
        <article className={styles.article}>
          <section id="s1">
            <h2>1. Introduction</h2>
            <h3>1.1 Purpose</h3>
            <p>
              These Community Guidelines outline the standards of respectful and responsible
              behaviour expected from all Students and Teachers using the BridgeLang Platform.
            </p>
            <h3>1.2 Scope</h3>
            <p>
              These Guidelines apply to all interactions on the Platform, including online lessons,
              in-person lessons arranged via the Platform, community contributions (e.g., posts,
              comments, shared materials), communications with BridgeLang staff and any other
              interactions facilitated through the Platform.
            </p>
          </section>

          <section id="s2">
            <h2>2. Respectful Communication</h2>
            <h3>2.1 Courtesy and Professionalism</h3>
            <p>
              All Users must communicate in a respectful and professional manner. Harassment,
              offensive language, or discriminatory remarks will not be tolerated.
            </p>
            <h3>2.2 Constructive Feedback</h3>
            <p>
              Feedback should be polite and constructive. Personal attacks or inappropriate criticism
              of Students or Teachers is strictly prohibited.
            </p>
            <h3>2.3 Prohibited Conduct</h3>
            <p>
              Hate speech, harassment, threats of violence, sexual or sexually suggestive content,
              discriminatory slurs, doxxing (sharing private data), and any content reasonably likely
              to cause distress are strictly prohibited.
            </p>
          </section>

          <section id="s3">
            <h2>3. Inclusivity and Equal Treatment</h2>
            <h3>3.1 Non-Discrimination</h3>
            <p>
              BridgeLang promotes inclusivity. Discrimination or exclusion based on nationality,
              ethnicity, gender, religion, disability, or any other protected characteristic is forbidden.
            </p>
            <h3>3.2 Cultural Sensitivity</h3>
            <p>
              Users must show respect for cultural differences and avoid insensitive comments or behaviour.
            </p>
          </section>

          <section id="s4">
            <h2>4. Lesson Conduct</h2>
            <h3>4.1 Preparedness</h3>
            <p>Teachers and Students are expected to arrive on time and prepared for each lesson.</p>
            <h3>4.2 Professional Boundaries</h3>
            <p>
              Lessons should remain focused on learning objectives. Personal or inappropriate discussions
              unrelated to education are not allowed.
            </p>
            <h3>4.3 In-Person Lessons</h3>
            <p>
              When in-person lessons occur, both Teacher and Student must respect safety and safeguarding
              measures as outlined in the In-Person Lesson Disclaimer.
            </p>
            <h3>4.4 Online Lessons</h3>
            <p>
              Online lessons must be conducted with the same level of professionalism and respect as
              in-person lessons. Students and Teachers are expected to ensure technical readiness,
              maintain an appropriate environment, protect privacy, and adhere to BridgeLang’s safety
              and safeguarding standards.
            </p>
            <h3>4.5 Recording and Privacy</h3>
            <p>
              Recording lessons, taking screenshots, or sharing any portion of a lesson (audio, video,
              text, or materials) is prohibited without prior explicit consent and only where permitted
              by law and BridgeLang policies.
            </p>
            <h3>4.6 Respect and Conduct</h3>
            <p>
              Teachers and Students must not solicit personal favours or gifts, must avoid inappropriate
              personal discussions, and must maintain professional boundaries at all times.
            </p>
          </section>

          <section id="s5">
            <h2>5. Platform Integrity</h2>
            <h3>5.1 Use of the Platform</h3>
            <p>Users must not circumvent the Platform to arrange off-Platform payments or lessons.</p>
            <h3>5.2 Intellectual Property</h3>
            <p>Users must respect copyright and intellectual property rights when sharing materials.</p>
            <h3>5.3 Honest Representation</h3>
            <p>
              Users must provide accurate information in their profiles and interactions. Misrepresentation
              of identity, qualifications, or intentions is prohibited.
            </p>
          </section>

          <section id="s6">
            <h2>6. Safety and Safeguarding</h2>
            <h3>6.1 Minors (14–17 Years)</h3>
            <p>Students aged fourteen (14) to seventeen (17) may only participate with verified parental consent.</p>
            <h3>6.2 Safeguarding Concerns</h3>
            <p>Any safeguarding concerns should be reported immediately to contact@bridgelang.co.uk.</p>
            <h3>6.3 Inappropriate Behaviour</h3>
            <p>BridgeLang reserves the right to suspend or remove any account involved in harassment, exploitation, or unsafe behaviour.</p>
            <h3>6.4 No Direct Contact Details</h3>
            <p>
              Users—especially when the Student is aged fourteen (14) to seventeen (17)—must not exchange
              personal contact details (e.g., phone numbers, personal emails, social media handles) and
              must keep all communications on the Platform.
            </p>
          </section>

          <section id="s7">
            <h2>7. Community Contributions</h2>
            <h3>7.1 Social Media and Content Sharing</h3>
            <p>
              Users contributing to BridgeLang’s community spaces (e.g., posts, videos, idioms, or teaching tips)
              must ensure content is accurate, respectful, and does not infringe third-party rights.
            </p>
            <h3>7.2 Moderation</h3>
            <p>
              BridgeLang reserves the right to review, edit, or remove contributions that breach these
              Guidelines or applicable laws.
            </p>
            <h3>7.3 No Spam or Unauthorised Promotion</h3>
            <p>
              Unsolicited advertising, repetitive self-promotion, link farming, or any behaviour primarily
              intended to drive traffic off the Platform is not allowed.
            </p>
            <h3>7.4 Plagiarism and Attribution</h3>
            <p>
              Users must not plagiarise. When sharing third-party materials, ensure you have permission and
              provide appropriate attribution in line with copyright and intellectual property policies.
            </p>
          </section>

          <section id="s8">
            <h2>8. Enforcement</h2>
            <h3>8.1 Consequences of Breach</h3>
            <p>
              Violations of these Guidelines may result in warnings, temporary suspension, or permanent
              removal from the Platform.
            </p>
            <h3>8.2 Appeals</h3>
            <p>Users may contact contact@bridgelang.co.uk to request a review of enforcement actions.</p>
            <h3>8.3 Immediate Action</h3>
            <p>
              BridgeLang may take immediate action without prior notice for egregious violations
              (e.g., harassment, threats, child safety risks).
            </p>
            <h3>8.4 Enforcement Ladder</h3>
            <p>
              Depending on severity and history, actions may include a warning, temporary suspension,
              or permanent removal from the Platform.
            </p>
            <h3>8.5 Appeals and Timelines</h3>
            <p>
              Appeals may be submitted to contact@bridgelang.co.uk. BridgeLang will review appeals and
              aim to respond within ten (10) business days.
            </p>
          </section>

          <section id="s9">
            <h2>9. Updates to These Guidelines</h2>
            <h3>9.1 Policy Changes</h3>
            <p>BridgeLang may update these Guidelines to reflect changes in practices or applicable laws.</p>
            <h3>9.2 Notification</h3>
            <p>Any updates will be posted here with the “Last Updated” date revised accordingly.</p>
          </section>

          <section id="s10">
            <h2>10. Related Policies</h2>
            <ul>
              <li>10.1 Terms of Use — Sets out the contractual terms for use of the Platform.</li>
              <li>10.2 Acceptable Use Policy — Explains prohibited behaviours and use of the Platform.</li>
              <li>10.3 Privacy Policy — Details how personal data is collected, used, and protected.</li>
              <li>10.4 Cookie Policy — Explains the use of cookies and tracking technologies.</li>
              <li>10.5 Refund &amp; Cancellation Policy — Outlines conditions for refunds and cancellations.</li>
              <li>10.6 Parental Consent Policy — Governs parental approval for users aged fourteen (14) to seventeen (17).</li>
              <li>10.7 Data Protection Notice (UK GDPR) — Explains compliance with UK GDPR and user rights.</li>
              <li>10.8 In-Person Lesson Disclaimer — Clarifies responsibilities and risks for lessons held in person.</li>
            </ul>
          </section>
        </article>
      </main>
    </>
  );
}
