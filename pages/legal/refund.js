import Head from 'next/head';
import styles from '../../scss/RefundPolicy.module.scss';

export default function RefundCancellationPolicy() {
  return (
    <>
      <Head>
        <title>Refund & Cancellation Policy | BridgeLang</title>
        <meta
          name="description"
          content="BridgeLang UK Ltd refund and cancellation rules for lesson bookings, credits, teacher/student cancellations, technical issues, and processing timelines."
        />
        <meta name="robots" content="index,follow" />
      </Head>

      {/* -- navbar yüksekliğine göre offset istiyorsan inline custom property ver:
          style={{ '--nav-height': '64px' }}  */}
      <main className={`container py-4 ${styles.legal}`}>
        {/* Başlık */}
        <header className={styles.header}>
          <h1>Refund &amp; Cancellation Policy</h1>
          <p className={styles.sub}>
            <strong>BridgeLang UK Ltd.</strong><br />
            <em>Last Updated: 10 September 2025</em>
          </p>
        </header>

        {/* İçindekiler */}
        <aside className={styles.toc} aria-label="Contents">
          <h3>Contents</h3>
          <ol>
            <li><a href="#general">General Principles</a></li>
            <li><a href="#student-cancellations">Student Cancellations</a></li>
            <li><a href="#teacher-cancellations">Teacher Cancellations</a></li>
            <li><a href="#technical-issues">Technical Issues</a></li>
            <li><a href="#refund-processing">Refund Processing</a></li>
            <li><a href="#credits">Credits, Bonus Credits &amp; Loyalty</a></li>
            <li><a href="#non-refundable">Non‑Refundable Items</a></li>
            <li><a href="#mods">Modifications to this Policy</a></li>
          </ol>
        </aside>

        {/* İçerik */}
        <article className={styles.article}>
          <section id="general">
            <h2>1. General Principles</h2>
            <p>1.1. This Refund and Cancellation Policy applies to all users of BridgeLang.</p>
            <p>1.2. By purchasing lesson credits, bonus credits, or loyalty incentives, you agree to the terms outlined herein.</p>
            <p>1.3. <strong>Precedence:</strong> This Policy must be read together with the Terms of Use. In the event of any conflict, the Terms of Use prevail.</p>
            <p>1.4. <strong>Jurisdiction:</strong> This Policy applies exclusively to users, students, and teachers located within the United Kingdom.</p>
          </section>

          <section id="student-cancellations">
            <h2>2. Student Cancellations</h2>
            <p>2.1. Students may cancel scheduled lessons up to 24 hours before the lesson start time without incurring any fees.</p>
            <p>2.2. Cancellations made less than 24 hours before the scheduled lesson may be considered chargeable at the discretion of the teacher.</p>
            <p>2.3. <strong>No‑Shows:</strong> If a Student fails to attend a scheduled lesson without notice, the lesson may be treated as delivered in full and no refund or reschedule will apply.</p>
            <p>2.4. <strong>Rescheduling:</strong> Rescheduling within 24 hours of the lesson start time is treated as a late cancellation unless the Teacher agrees otherwise.</p>
            <p>2.5. <strong>Exceptional Circumstances:</strong> In genuine emergencies (to be verified) BridgeLang or the Teacher may offer a reschedule or credit reinstatement at their discretion.</p>
            <p>2.6. <strong>Time Calculation:</strong> All time‑based rules (including the 24‑hour window) are calculated based on the time zone displayed on the booking confirmation within the Platform.</p>
          </section>

          <section id="teacher-cancellations">
            <h2>3. Teacher Cancellations</h2>
            <p>3.1. If a teacher cancels a lesson, the student will automatically receive the lesson credit back to their account.</p>
            <p>3.2. BridgeLang may review teacher cancellation frequency to ensure reliability of services.</p>
            <p>3.3. <strong>Teacher Lateness:</strong> If a Teacher is late, the Student may request a reschedule or a pro‑rata credit for the portion of the lesson not delivered.</p>
          </section>

          <section id="technical-issues">
            <h2>4. Technical Issues</h2>
            <p>4.1. If a lesson cannot take place due to verifiable technical problems on the part of the teacher, the student will receive a full refund in credits.</p>
            <p>4.2. If a student experiences technical issues, they must promptly report them with evidence for BridgeLang to evaluate eligibility for a credit refund.</p>
            <p>4.3. <strong>Force Majeure:</strong> Where a failure to deliver or attend a lesson is caused by a force majeure event, remedies (including refunds or rescheduling) will be assessed in accordance with the Terms of Use and applicable law.</p>
          </section>

          <section id="refund-processing">
            <h2>5. Refund Processing</h2>
            <p>5.1. Refunds are generally issued in the form of credits added back to the student’s account.</p>
            <p>5.2. In exceptional circumstances, BridgeLang may consider monetary refunds, subject to evaluation.</p>
            <p>5.3. Refund requests must be submitted within 14 days of the scheduled lesson.</p>
            <p>5.3.a. This internal time limit does not affect any non‑waivable statutory consumer rights (including any applicable cooling‑off rights).</p>
            <p>5.4. <strong>Statutory Cooling‑Off (Consumers):</strong> Where statutory cooling‑off rights apply and no portion of the service has been used, unused amounts will be refunded to the original payment method; once any portion is used, any refund is proportionally reduced in line with applicable law and the Terms of Use.</p>
            <p>5.5. <strong>Original Payment Method:</strong> Monetary refunds (if any) are issued to the original payment method unless required otherwise by law.</p>
            <p>5.6. <strong>Processing Time:</strong> Approved refunds are typically processed within 14 business days, subject to payment‑provider timelines and will, in any case, be completed within any shorter period required by applicable law for statutory cooling‑off refunds.</p>
            <p>5.7. <strong>How to Submit:</strong> Refund requests must be submitted via the in‑app support form or to <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a> and include booking ID, date/time, and reason.</p>
            <p>5.8. <strong>Abuse &amp; Fraud:</strong> BridgeLang may decline or reverse refunds in cases of suspected fraud, misuse, or breach of the Terms of Use.</p>
          </section>

          <section id="credits">
            <h2>6. Credits, Bonus Credits and Loyalty Incentives</h2>
            <p>6.1. Purchased credits are non‑transferable and tied to the account from which they were purchased.</p>
            <p>6.2. Bonus credits (e.g., promotional or goodwill credits) are granted at the discretion of BridgeLang and may carry specific expiration dates.</p>
            <p>6.3. Loyalty incentives or reward credits, when provided, may not be converted into cash and are valid only for lesson bookings.</p>
            <p>6.4. Credits used to book lessons that are subsequently canceled in accordance with Section 2 will be reissued to the student’s account.</p>
            <p>6.5. Any expired bonus credits or loyalty credits cannot be reinstated.</p>
            <p>6.6. For the avoidance of doubt, no refunds or compensation will be issued for unused, expired, or forfeited credits.</p>
            <p>6.7. <strong>Mixed Redemptions:</strong> If a booking used both Paid Credits and Bonus Credits, only the unused Paid Credits portion is eligible for refund; Bonus Credits are non‑refundable.</p>
            <p>6.8. <strong>Adjustments and Chargebacks:</strong> In the event of chargebacks, errors, or suspected abuse, BridgeLang may adjust balances, cancel Bonus Credits, or place an account balance in a negative state pending resolution.</p>
          </section>

          <section id="non-refundable">
            <h2>7. Non‑Refundable Items</h2>
            <p>7.1. Credits, bonus credits, and loyalty incentives already applied to lessons that took place are non‑refund­able.</p>
            <p>7.2. Expired credits, bonus credits, or incentives are non‑refundable (see Section 6.4 and 6.6).</p>
            <p>7.3. <strong>Payment Processor Fees:</strong> Third‑party processing fees (e.g., payment‑provider fees) are non‑refundable unless required by applicable law.</p>
          </section>

          <section id="mods">
            <h2>8. Modifications to this Policy</h2>
            <p>8.1. BridgeLang reserves the right to amend this Refund and Cancellation Policy from time to time.</p>
            <p>8.2. Updates will be posted on our website, and continued use of the platform constitutes acceptance of the revised policy.</p>
          </section>
        </article>
      </main>
    </>
  );
}
