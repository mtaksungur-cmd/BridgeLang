// pages/faq.js
import Head from "next/head";

export default function FAQ() {
  return (
    <>
      <Head>
        <title>Frequently Asked Questions (FAQ) | BridgeLang</title>
        <meta
          name="description"
          content="Frequently Asked Questions for BridgeLang: accounts, lessons & credits, cancellations & refunds, teachers & payments, conduct & safety, parental consent, technical support, privacy & data, disputes & legal, complaints."
        />
      </Head>

      <div className="container py-5">
        {/* Header */}
        <header className="text-center mb-4">
          <h1 className="h3 fw-bold">Frequently Asked Questions (FAQ) – BridgeLang UK Ltd.</h1>
        </header>

        {/* Quick category links */}
        <nav className="mb-4 text-center">
          <a className="btn btn-sm btn-outline-secondary m-1" href="#general">General</a>
          <a className="btn btn-sm btn-outline-secondary m-1" href="#accounts">Accounts</a>
          <a className="btn btn-sm btn-outline-secondary m-1" href="#credits">Lessons &amp; Credits</a>
          <a className="btn btn-sm btn-outline-secondary m-1" href="#refunds">Cancellations &amp; Refunds</a>
          <a className="btn btn-sm btn-outline-secondary m-1" href="#teachers">Teachers &amp; Payments</a>
          <a className="btn btn-sm btn-outline-secondary m-1" href="#conduct">Conduct &amp; Safety</a>
          <a className="btn btn-sm btn-outline-secondary m-1" href="#consent">Parental Consent</a>
          <a className="btn btn-sm btn-outline-secondary m-1" href="#technical">Technical &amp; Support</a>
          <a className="btn btn-sm btn-outline-secondary m-1" href="#privacy">Privacy &amp; Data</a>
          <a className="btn btn-sm btn-outline-secondary m-1" href="#legal">Disputes &amp; Legal</a>
          <a className="btn btn-sm btn-outline-secondary m-1" href="#complaints">Support &amp; Complaints</a>
          <a className="btn btn-sm btn-outline-secondary" href="#future">Future</a>
        </nav>

        {/* 1. General Information */}
        <section id="general" className="mb-5">
          <h2 className="h5 fw-bold mb-3">1. General Information</h2>
          <div className="accordion" id="accGeneral">
            <div className="accordion-item">
              <h2 className="accordion-header" id="g1">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#gc1">
                  Q1: What is BridgeLang?
                </button>
              </h2>
              <div id="gc1" className="accordion-collapse collapse show" data-bs-parent="#accGeneral">
                <div className="accordion-body">
                  BridgeLang is an online platform that connects Students and Teachers for language lessons.
                  It operates in the UK and provides both online and in-person lessons.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="g2">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#gc2">
                  Q2: Who can use BridgeLang?
                </button>
              </h2>
              <div id="gc2" className="accordion-collapse collapse" data-bs-parent="#accGeneral">
                <div className="accordion-body">
                  The Platform is available to individuals aged 18 and above. Students aged 14–17 may also join,
                  but only with verified parental/guardian consent.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Accounts and Registration */}
        <section id="accounts" className="mb-5">
          <h2 className="h5 fw-bold mb-3">2. Accounts and Registration</h2>
          <div className="accordion" id="accAccounts">
            <div className="accordion-item">
              <h2 className="accordion-header" id="a1">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#ac1">
                  Q3: Do I need an account to use the Platform?
                </button>
              </h2>
              <div id="ac1" className="accordion-collapse collapse show" data-bs-parent="#accAccounts">
                <div className="accordion-body">
                  Yes. Both Students and Teachers must register for an account and provide accurate information.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="a2">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#ac2">
                  Q4: Can I share my account with someone else?
                </button>
              </h2>
              <div id="ac2" className="accordion-collapse collapse" data-bs-parent="#accAccounts">
                <div className="accordion-body">
                  No. Accounts are personal and may not be shared.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Lessons and Credits */}
        <section id="credits" className="mb-5">
          <h2 className="h5 fw-bold mb-3">3. Lessons and Credits</h2>
          <div className="accordion" id="accCredits">
            <div className="accordion-item">
              <h2 className="accordion-header" id="c1">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#cc1">
                  Q5: What are Lesson Credits?
                </button>
              </h2>
              <div id="cc1" className="accordion-collapse collapse show" data-bs-parent="#accCredits">
                <div className="accordion-body">
                  Lesson Credits are prepaid units purchased by Students to book lessons with Teachers.
                  They have no monetary value outside the Platform.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="c2">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#cc2">
                  Q6: Do Credits expire?
                </button>
              </h2>
              <div id="cc2" className="accordion-collapse collapse" data-bs-parent="#accCredits">
                <div className="accordion-body">
                  Yes. Credits may have expiry dates depending on your subscription or promotion terms.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="c3">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#cc3">
                  Q7: What are Bonus Credits?
                </button>
              </h2>
              <div id="cc3" className="accordion-collapse collapse" data-bs-parent="#accCredits">
                <div className="accordion-body">
                  Bonus Credits are promotional or loyalty rewards occasionally provided by BridgeLang.
                  They are non-transferable, may have shorter expiry dates, and cannot be redeemed for cash.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="c4">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#cc4">
                  Q8: Are loyalty incentives transferable?
                </button>
              </h2>
              <div id="cc4" className="accordion-collapse collapse" data-bs-parent="#accCredits">
                <div className="accordion-body">
                  No. Loyalty rewards and bonus credits are tied to the Student’s account and cannot be sold, shared, or exchanged.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Cancellations and Refunds */}
        <section id="refunds" className="mb-5">
          <h2 className="h5 fw-bold mb-3">4. Cancellations and Refunds</h2>
          <div className="accordion" id="accRefunds">
            <div className="accordion-item">
              <h2 className="accordion-header" id="r1">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#rc1">
                  Q9: Can I cancel a subscription?
                </button>
              </h2>
              <div id="rc1" className="accordion-collapse collapse show" data-bs-parent="#accRefunds">
                <div className="accordion-body">
                  Yes. You can cancel anytime via your account dashboard. However, partial refunds are generally
                  not available unless required by law.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="r2">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#rc2">
                  Q10: What if I cancel within 14 days?
                </button>
              </h2>
              <div id="rc2" className="accordion-collapse collapse" data-bs-parent="#accRefunds">
                <div className="accordion-body">
                  UK consumers have a statutory 14-day cooling-off period to cancel purchases and receive a refund,
                  provided services have not been fully used.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="r3">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#rc3">
                  Q11: What if I cancel a lesson late?
                </button>
              </h2>
              <div id="rc3" className="accordion-collapse collapse" data-bs-parent="#accRefunds">
                <div className="accordion-body">
                  If a lesson is cancelled less than 24 hours before the start time, the Teacher may decide whether the Credit is forfeited.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Teachers and Payments */}
        <section id="teachers" className="mb-5">
          <h2 className="h5 fw-bold mb-3">5. Teachers and Payments</h2>
          <div className="accordion" id="accTeachers">
            <div className="accordion-item">
              <h2 className="accordion-header" id="t1">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#tc1">
                  Q12: How are Teachers paid?
                </button>
              </h2>
              <div id="tc1" className="accordion-collapse collapse show" data-bs-parent="#accTeachers">
                <div className="accordion-body">
                  Teachers receive 80% of the lesson fee. BridgeLang retains 20% as a service fee.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="t2">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#tc2">
                  Q13: How are payments processed?
                </button>
              </h2>
              <div id="tc2" className="accordion-collapse collapse" data-bs-parent="#accTeachers">
                <div className="accordion-body">
                  Payments are made securely via Stripe Connect. Teachers must maintain a valid payment account.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="t3">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#tc3">
                  Q14: How are Teachers verified before joining?
                </button>
              </h2>
              <div id="tc3" className="accordion-collapse collapse" data-bs-parent="#accTeachers">
                <div className="accordion-body">
                  All Teachers must meet BridgeLang’s eligibility requirements and provide identity verification.
                  Additional background or qualification checks may be requested.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="t4">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#tc4">
                  Q15: Can Teachers set their own lesson prices?
                </button>
              </h2>
              <div id="tc4" className="accordion-collapse collapse" data-bs-parent="#accTeachers">
                <div className="accordion-body">
                  Yes. Teachers may set their lesson rates within platform guidelines, but BridgeLang applies
                  the agreed service fee to all bookings.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Conduct and Safety */}
        <section id="conduct" className="mb-5">
          <h2 className="h5 fw-bold mb-3">6. Conduct and Safety</h2>
          <div className="accordion" id="accConduct">
            <div className="accordion-item">
              <h2 className="accordion-header" id="co1">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#coc1">
                  Q16: Can I arrange lessons outside the Platform?
                </button>
              </h2>
              <div id="coc1" className="accordion-collapse collapse show" data-bs-parent="#accConduct">
                <div className="accordion-body">
                  No. Off-platform lessons and payments are strictly prohibited.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="co2">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#coc2">
                  Q17: What are the rules for behaviour?
                </button>
              </h2>
              <div id="coc2" className="accordion-collapse collapse" data-bs-parent="#accConduct">
                <div className="accordion-body">
                  Users must act respectfully and lawfully. Harassment, discrimination, or abusive conduct may result
                  in suspension or termination.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="co3">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#coc3">
                  Q18: Are in-person lessons safe?
                </button>
              </h2>
              <div id="coc3" className="accordion-collapse collapse" data-bs-parent="#accConduct">
                <div className="accordion-body">
                  Yes, but they are undertaken at your own risk. Students under 18 require parental consent,
                  and Teachers are encouraged to follow BridgeLang’s safety guidelines.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Parental Consent */}
        <section id="consent" className="mb-5">
          <h2 className="h5 fw-bold mb-3">7. Parental Consent</h2>
          <div className="accordion" id="accConsent">
            <div className="accordion-item">
              <h2 className="accordion-header" id="pc1">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#pcc1">
                  Q19: Can a 15-year-old join BridgeLang?
                </button>
              </h2>
              <div id="pcc1" className="accordion-collapse collapse show" data-bs-parent="#accConsent">
                <div className="accordion-body">
                  Yes, but only with verified parental or guardian consent.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="pc2">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#pcc2">
                  Q20: How is parental consent verified?
                </button>
              </h2>
              <div id="pcc2" className="accordion-collapse collapse" data-bs-parent="#accConsent">
                <div className="accordion-body">
                  Both the Student and Parent/Guardian receive confirmation emails. The account remains inactive
                  until both confirm.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Technical Issues and Support */}
        <section id="technical" className="mb-5">
          <h2 className="h5 fw-bold mb-3">8. Technical Issues and Support</h2>
          <div className="accordion" id="accTech">
            <div className="accordion-item">
              <h2 className="accordion-header" id="ti1">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#tic1">
                  Q21: What happens if my internet disconnects during a lesson?
                </button>
              </h2>
              <div id="tic1" className="accordion-collapse collapse show" data-bs-parent="#accTech">
                <div className="accordion-body">
                  Both Student and Teacher should attempt to reconnect. If reconnection is not possible, BridgeLang may,
                  at its discretion, arrange for the lesson to be rescheduled or Credits refunded.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="ti2">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#tic2">
                  Q22: How can I contact customer support?
                </button>
              </h2>
              <div id="tic2" className="accordion-collapse collapse" data-bs-parent="#accTech">
                <div className="accordion-body">
                  You can reach BridgeLang at <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a> for technical or account support.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="ti3">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#tic3">
                  Q23: Can I use BridgeLang on my mobile phone or tablet?
                </button>
              </h2>
              <div id="tic3" className="accordion-collapse collapse" data-bs-parent="#accTech">
                <div className="accordion-body">
                  Yes. BridgeLang works on most modern devices. For the best experience, use an up-to-date browser.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="ti4">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#tic4">
                  Q24: Which browsers work best with BridgeLang?
                </button>
              </h2>
              <div id="tic4" className="accordion-collapse collapse" data-bs-parent="#accTech">
                <div className="accordion-body">
                  We recommend using Chrome, Safari, or Firefox. Internet Explorer is not supported.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Privacy and Data */}
        <section id="privacy" className="mb-5">
          <h2 className="h5 fw-bold mb-3">9. Privacy and Data</h2>
          <div className="accordion" id="accPrivacy">
            <div className="accordion-item">
              <h2 className="accordion-header" id="pr1">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#prc1">
                  Q25: How is my personal data protected?
                </button>
              </h2>
              <div id="prc1" className="accordion-collapse collapse show" data-bs-parent="#accPrivacy">
                <div className="accordion-body">
                  All personal data is processed in line with the BridgeLang Privacy Policy and UK GDPR.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="pr2">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#prc2">
                  Q26: Can I request deletion of my data?
                </button>
              </h2>
              <div id="prc2" className="accordion-collapse collapse" data-bs-parent="#accPrivacy">
                <div className="accordion-body">
                  Yes. You may exercise your rights (including data deletion) under the Privacy Policy by contacting BridgeLang.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 10. Disputes and Legal */}
        <section id="legal" className="mb-5">
          <h2 className="h5 fw-bold mb-3">10. Disputes and Legal</h2>
          <div className="accordion" id="accLegal">
            <div className="accordion-item">
              <h2 className="accordion-header" id="l1">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#lc1">
                  Q27: What happens if there is a dispute?
                </button>
              </h2>
              <div id="lc1" className="accordion-collapse collapse show" data-bs-parent="#accLegal">
                <div className="accordion-body">
                  Disputes should first be resolved amicably. If unresolved, mediation or arbitration in the UK may be pursued.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="l2">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#lc2">
                  Q28: What law applies?
                </button>
              </h2>
              <div id="lc2" className="accordion-collapse collapse" data-bs-parent="#accLegal">
                <div className="accordion-body">
                  This Agreement is governed by the laws of England and Wales, with courts in England and Wales having exclusive jurisdiction.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 11. Support and Complaints */}
        <section id="complaints" className="mb-5">
          <h2 className="h5 fw-bold mb-3">11. Support and Complaints</h2>
          <div className="accordion" id="accComplaints">
            <div className="accordion-item">
              <h2 className="accordion-header" id="sc1h">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#scc1">
                  Q29: How do I report inappropriate behaviour?
                </button>
              </h2>
              <div id="scc1" className="accordion-collapse collapse show" data-bs-parent="#accComplaints">
                <div className="accordion-body">
                  You can report misconduct directly through the Platform’s reporting feature or by contacting{" "}
                  <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="sc2h">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#scc2">
                  Q30: What happens after I submit a complaint?
                </button>
              </h2>
              <div id="scc2" className="accordion-collapse collapse" data-bs-parent="#accComplaints">
                <div className="accordion-body">
                  BridgeLang reviews all reports promptly. Depending on the case, action may include warnings,
                  suspension, or permanent account removal.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 12. Future Developments */}
        <section id="future" className="mb-5">
          <h2 className="h5 fw-bold mb-3">12. Future Developments</h2>
          <div className="accordion" id="accFuture">
            <div className="accordion-item">
              <h2 className="accordion-header" id="f1">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#fc1">
                  Q31: Will BridgeLang add more languages in the future?
                </button>
              </h2>
              <div id="fc1" className="accordion-collapse collapse show" data-bs-parent="#accFuture">
                <div className="accordion-body">
                  Yes. While the current focus is English, BridgeLang may expand to offer other in-demand languages
                  depending on user needs and teacher availability.
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
