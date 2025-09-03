// pages/legal/terms.js
import Head from 'next/head';
import styles from '../../scss/LegalCommon.module.scss';

export default function TermsOfUse() {
  return (
    <>
      <Head>
        <title>Terms of Use | BridgeLang</title>
        <meta
          name="description"
          content="BridgeLang UK Ltd Terms of Use — eligibility, accounts, subscriptions, credits, bookings, teacher obligations, liability, governing law (England & Wales), and more."
        />
        <meta name="robots" content="index,follow" />
      </Head>

      <main className={`container py-4 ${styles.legal}`} style={{ '--nav-height': '64px' }}>
        <header className={styles.header}>
          <h1>Terms of Use</h1>
          <p className={styles.sub}>
            <strong>BRIDGELANG UK LTD.</strong><br />
            <em>Effective date: 10 August 2025</em>
          </p>
        </header>

        {/* Contents / TOC */}
        <aside className={styles.toc} aria-label="Contents">
          <h3>Contents</h3>
          <ol>
            <li><a href="#A">Section A: General Terms and Conditions</a></li>
            <li><a href="#B">Section B: Terms Specific to Students</a></li>
            <li><a href="#C">Section C: Terms Specific to Teachers</a></li>
            <li><a href="#final">Final Acknowledgement</a></li>
          </ol>
        </aside>

        <article className={styles.article}>
          {/* SECTION A */}
          <section id="A">
            <h2>Section A: General Terms and Conditions</h2>

            <h3 id="A1">A.1 Definitions</h3>
            <p><strong>A.1.1</strong> &quot;BridgeLang&quot; (also referred to as &quot;we&quot; or &quot;us&quot;) means BridgeLang UK Ltd, the company providing the online language education services and Platform.</p>
            <p><strong>A.1.2</strong> &quot;Platform&quot; means the BridgeLang online language education platform, including the website, any associated mobile applications, and related services provided by BridgeLang.</p>
            <p><strong>A.1.3</strong> &quot;User&quot; or &quot;you&quot; means any person who accesses or uses the Platform, whether as a Student or as a Teacher.</p>
            <p><strong>A.1.4</strong> &quot;Student&quot; means a User who uses the Platform to receive language lessons or other educational services.</p>
            <p><strong>A.1.5</strong> &quot;Teacher&quot; (also referred to as a &quot;Tutor&quot;) means a User who provides language instruction or tutoring services to Students through the Platform.</p>
            <p><strong>A.1.6</strong> &quot;Lesson Credits&quot; (or simply &quot;Credits&quot;) are units of prepaid value on the Platform that can be purchased by Students and redeemed to book lessons or sessions with Teachers.</p>
            <p><strong>A.1.7</strong> &quot;Terms&quot; or &quot;Agreement&quot; refers to these Terms of Use, which form a legally binding contract between the User and BridgeLang UK Ltd.</p>

            <h3 id="A2">A.2 Introduction</h3>
            <p><strong>A.2.1</strong> This Agreement is a legally binding contract between the User and BridgeLang UK Ltd, governing the User&apos;s access to and use of the BridgeLang Platform.</p>
            <p><strong>A.2.2</strong> By registering an account, accessing, or using the Platform in any manner, the User acknowledges and agrees to comply with all terms and conditions set forth in this Agreement.</p>

            <h3 id="A3">A.3 Eligibility</h3>
            <h4 id="A3-1">A.3.1 General Rule</h4>
            <p><strong>A.3.1.1</strong> Use of the Platform is limited to individuals who are at least eighteen (18) years of age and reside in the United Kingdom.</p>
            <p><strong>A.3.1.2</strong> The Platform is not offered to minors (individuals under 18), except as expressly permitted under Section A.3.2.</p>
            <p><strong>A.3.1.3</strong> BridgeLang reserves the right to refuse access to the Platform to any person who does not meet these eligibility criteria or if use of the Platform would violate any applicable laws or regulations.</p>

            <h4 id="A3-2">A.3.2 Exception for 14–17-Year-Old Students</h4>
            <p><strong>A.3.2.1</strong> Students aged 14 to 17 may use the Platform in compliance with applicable UK laws provided that: (a) their parent or legal guardian has given explicit consent; and (b) all necessary child safeguarding measures, as determined by BridgeLang, are in place.</p>
            <p><strong>A.3.2.2</strong> BridgeLang may impose additional vetting, verification, or safeguarding requirements (including, where applicable, enhanced background screening for Teachers) before enabling access for 14–17-year-old Students; see also Section C.1.</p>

            <h3 id="A4">A.4 Account Registration and Security</h3>
            <p><strong>A.4.1</strong> Users must create an account to access certain features of the Platform and provide truthful, accurate, current, and complete information.</p>
            <p><strong>A.4.2</strong> Users are responsible for updating their account details as necessary.</p>
            <p><strong>A.4.3</strong> Users must keep account credentials confidential and must not share their account or password with others.</p>
            <p><strong>A.4.4</strong> Users must notify BridgeLang immediately if they suspect unauthorized account access.</p>
            <p><strong>A.4.5</strong> Users are responsible for all activities under their account and may be liable for losses incurred by BridgeLang or others due to unauthorized use.</p>

            <h3 id="A5">A.5 Data Protection and Privacy</h3>
            <p><strong>A.5.1</strong> BridgeLang processes personal data in accordance with UK GDPR and applicable data protection laws.</p>
            <p><strong>A.5.2</strong> Users must review and accept the Privacy Policy and Cookie Policy before creating an account.</p>
            <p><strong>A.5.3</strong> BridgeLang will use personal information only as outlined in those policies and will implement technical and organizational measures to protect data.</p>
            <p><strong>A.5.4</strong> The collection, use, and retention of personal data, including any data relating to minors permitted under Section A.3.2, shall be handled in accordance with our Privacy Policy, which specifies applicable retention periods and the process for obtaining and recording explicit consent where required.</p>

            <h3 id="A6">A.6 Changes to Terms and Services</h3>
            <p><strong>A.6.1</strong> BridgeLang may modify or update these Terms at any time.</p>
            <p><strong>A.6.2</strong> For material changes, notice will be given to Users (e.g., by email or Platform notice).</p>
            <p><strong>A.6.3</strong> Continued use after the effective date of updated Terms constitutes acceptance.</p>
            <p><strong>A.6.4</strong> Users who disagree with the updated Terms must stop using the Platform and may terminate their account.</p>
            <p><strong>A.6.5</strong> BridgeLang may modify, enhance, suspend, or discontinue any aspect of the Services or Platform features from time to time. Where a change materially affects Users, BridgeLang will use reasonable efforts to give prior notice. Any such change shall not, by itself, entitle Users to compensation, save as expressly provided by law or this Agreement.</p>

            <h3 id="A7">A.7 Intellectual Property Rights</h3>
            <p><strong>A.7.1</strong> All trademarks, logos, service marks, course materials, software, and other proprietary content on the Platform belong to BridgeLang UK Ltd or its licensors.</p>
            <p><strong>A.7.2</strong> Users are granted a limited, non-exclusive, non-transferable licence to use Platform content solely for educational purposes.</p>
            <p><strong>A.7.3</strong> No content may be copied, reproduced, distributed, published, modified, or transmitted without prior written consent, except as allowed by law.</p>

            <h3 id="A8">A.8 Prohibited Conduct</h3>
            <h4 id="A8-1">A.8.1 Circumventing the Platform</h4>
            <p><strong>A.8.1.1</strong> Sharing personal contact details to conduct lessons or transactions outside the Platform is prohibited.</p>

            <h4 id="A8-2">A.8.2 Off-Platform Transactions</h4>
            <p><strong>A.8.2.1</strong> Arranging lessons or tutoring sessions outside the Platform&apos;s booking and payment systems is prohibited.</p>

            <h4 id="A8-3">A.8.3 Abusive or Unlawful Behavior</h4>
            <p><strong>A.8.3.1</strong> Harassing, threatening, abusive, defamatory, profane, discriminatory, or otherwise unlawful behavior is prohibited.</p>
            <p><strong>A.8.3.2</strong> Sexually explicit, hateful, or objectionable content or conduct is prohibited.</p>
            <p><strong>A.8.3.3</strong> Violations may result in suspension, termination, and/or legal action.</p>
            <p><strong>A.8.3.4</strong> Without prejudice to the right to terminate immediately for serious misconduct, BridgeLang may, at its sole discretion, apply a progressive enforcement process, which may include one or more of the following: (a) issuing a warning, (b) restricting certain account features, (c) temporarily suspending the account, and (d) terminating the account.</p>

            <h4 id="A8-4">A.8.4 Acceptable Use and Code of Conduct</h4>
            <p>Users shall not: (a) upload or transmit unlawful, defamatory, obscene, hateful, or infringing content; (b) circumvent or attempt to bypass security, booking, or payment mechanisms; (c) harvest personal data or send spam; (d) record lessons without the other party&apos;s consent; (e) use the Platform to solicit off-Platform transactions. Breach of this clause may result in measures described in Section A.8 and/or termination pursuant to this Agreement.</p>

            <h3 id="A9">A.9 Contact Information</h3>
            <p>
              BridgeLang UK Ltd<br />
              Registered Office: The Apex, Derriford Business Park, Brest Road, Plymouth, PL6 5FL, United Kingdom<br />
              Email: <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a><br />
              Company Registration Number: 16555217<br />
              Registered in England and Wales
            </p>

            <h3 id="A10">A.10 Limitation of Liability</h3>
            <p><strong>A.10.1</strong> To the fullest extent permitted by law, BridgeLang UK Ltd shall not be liable for any indirect, consequential, exemplary, or incidental losses or damages arising out of or related to the use of the Platform or the services provided.</p>
            <p><strong>A.10.2</strong> This includes, but is not limited to, any loss resulting from dissatisfaction with a lesson, the conduct of any User (Student or Teacher), or technical problems (such as connectivity issues or Platform downtime).</p>
            <p><strong>A.10.3</strong> In all cases, BridgeLang&apos;s total liability for any claim arising from or related to this Agreement or use of the Platform (whether in contract, tort, or otherwise) shall be limited to the total fees actually paid by the User to BridgeLang in the three (3) months immediately preceding the event giving rise to the claim.</p>
            <p><strong>A.10.4</strong> Nothing in these Terms excludes or limits liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be excluded or limited under applicable law.</p>
            <p><strong>A.10.5</strong> <em>Service Availability.</em> While BridgeLang aims to provide continuous access to the Platform, availability may be suspended or limited for maintenance, updates, or technical issues. Where reasonably possible, prior notice will be given. BridgeLang shall not be liable for any unavailability or interruption to the extent permitted by law.</p>

            <h3 id="A11">A.11 Entire Agreement</h3>
            <p><strong>A.11.1</strong> This Agreement (together with the Privacy Policy, Cookie Policy, and any other policies or guidelines referenced herein) constitutes the entire agreement between BridgeLang UK Ltd and the User with respect to the subject matter contained herein.</p>
            <p><strong>A.11.2</strong> It supersedes and replaces all prior or contemporaneous understandings, agreements, representations, and warranties, whether written or oral, regarding the same subject matter.</p>
            <p><strong>A.11.3</strong> The User acknowledges that they have not relied upon any statement, representation, warranty, or understanding other than those expressly set out in this Agreement.</p>
            <p><strong>A.11.4</strong> In the event of any discrepancy or inconsistency between the English version of this Agreement and any translation, the English version shall prevail and be the binding version.</p>

            <h3 id="A12">A.12 Force Majeure</h3>
            <p><strong>A.12.1</strong> Neither party shall be liable or responsible for any failure or delay in performing its obligations under this Agreement if and to the extent that such failure or delay is caused by a Force Majeure Event.</p>
            <p><strong>A.12.2</strong> For the purposes of this Agreement, a &quot;Force Majeure Event&quot; means any event or circumstance beyond the reasonable control of the affected party, including but not limited to acts of God; flood, drought, earthquake, storm, fire; epidemic or pandemic; war, armed conflict, terrorist attack, civil commotion; industrial dispute, strike, lockout; interruption or failure of utility service; or severe technical failures (such as prolonged internet outages or platform downtime).</p>
            <p><strong>A.12.3</strong> The affected party shall: (a) notify the other party as soon as reasonably practicable of the Force Majeure Event and its anticipated impact on performance; and (b) use all reasonable endeavours to mitigate the effects of the Force Majeure Event and resume full performance as soon as possible.</p>
            <p><strong>A.12.4</strong> If the period of delay or non-performance continues for more than thirty (30) days, the party not affected may terminate this Agreement by giving written notice to the affected party.</p>

            <h3 id="A13">A.13 Indemnification</h3>
            <p><strong>A.13.1</strong> The User agrees to indemnify and hold harmless BridgeLang UK Ltd, its affiliates, officers, directors, employees, and agents from and against any and all third-party claims, losses, liabilities, damages, costs, and expenses (including reasonable legal fees) arising out of or related to: (a) the User&apos;s breach of this Agreement; (b) the User&apos;s misuse of the Platform; or (c) the User&apos;s violation of any law or third-party right, including intellectual property rights.</p>
            <p><strong>A.13.2</strong> BridgeLang reserves the right to assume the exclusive defence and control of any matter subject to indemnification by the User, in which case the User agrees to cooperate fully.</p>

            <h3 id="A14">A.14 Third-Party Services</h3>
            <p><strong>A.14.1</strong> The Platform may integrate or link to third-party services (including, without limitation, payment processing by Stripe and video conferencing by Zoom).</p>
            <p><strong>A.14.2</strong> BridgeLang is not responsible for the availability, security, or functionality of such third-party services and does not endorse or assume liability for any third-party content, products, or services.</p>
            <p><strong>A.14.3</strong> Use of third-party services is subject to the terms and policies of those third parties.</p>

            <h3 id="A15">A.15 Assignment</h3>
            <p><strong>A.15.1</strong> BridgeLang may assign, transfer, or subcontract its rights and obligations under this Agreement, in whole or in part, at any time without notice to the User.</p>
            <p><strong>A.15.2</strong> The User may not assign or transfer any rights or obligations under this Agreement without BridgeLang&apos;s prior written consent.</p>
            <p><strong>A.15.3</strong> This Agreement shall be binding upon and inure to the benefit of the parties and their permitted successors and assigns.</p>

            <h3 id="A16">A.16 Severability</h3>
            <p><strong>A.16.1</strong> If any provision of this Agreement is found to be invalid, illegal, or unenforceable, that provision shall be deemed modified to the minimum extent necessary to make it valid and enforceable, and the remaining provisions shall remain in full force and effect.</p>

            <h3 id="A17">A.17 Survival</h3>
            <p><strong>A.17.1</strong> Provisions which by their nature should survive termination shall survive, including without limitation: intellectual property rights, limitation of liability, indemnification, privacy and data protection obligations, governing law and jurisdiction, and dispute resolution clauses.</p>

            <h3 id="A18">A.18 Governing Law and Jurisdiction</h3>
            <p>This Agreement and any dispute or claim arising out of or in connection with it (including non-contractual disputes or claims) shall be governed by and construed in accordance with the laws of England and Wales. The parties submit to the exclusive jurisdiction of the courts of England and Wales.</p>

            <h3 id="A19">A.19 Dispute Resolution</h3>
            <p><strong>A.19.1</strong> The parties shall first attempt in good faith to resolve any dispute arising out of or in connection with this Agreement by negotiation.</p>
            <p><strong>A.19.2</strong> If the dispute is not resolved within 30 days, either party may refer the matter to mediation administered in the United Kingdom by a recognised provider. The mediation shall take place in London and be conducted in English.</p>
            <p><strong>A.19.3</strong> If the dispute remains unresolved 30 days after a request for mediation, it may be finally resolved by arbitration seated in London, conducted in English, before a sole arbitrator, in accordance with the Arbitration Act 1996 and the rules of a recognised arbitral institution agreed by the parties.</p>
            <p><strong>A.19.4</strong> Nothing in this clause prevents either party from seeking urgent injunctive or equitable relief from a court of competent jurisdiction or from pursuing a claim in the small claims court.</p>

            <h3 id="A20">A.20 Sanctions and Anti-Money Laundering Compliance</h3>
            <p><strong>A.20.1</strong> BridgeLang may refuse, suspend, or terminate any User&apos;s access to the Platform, or withhold payments, to comply with applicable sanctions, export control, or anti-money laundering (AML) laws and regulations.</p>
            <p><strong>A.20.2</strong> BridgeLang may also take such action where a User appears on any relevant government sanctions list or where a transaction is suspected to involve prohibited activities under applicable laws.</p>
            <p><strong>A.20.3</strong> Users represent and warrant that they are not located in, or ordinarily resident in, any country or territory subject to comprehensive sanctions, and are not a person or entity listed on any government sanctions list.</p>

            <h3 id="A21">A.21 Data Protection</h3>
            <p><strong>A.21.1</strong> BridgeLang processes personal data in accordance with applicable data protection laws, including the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>
            <p><strong>A.21.2</strong> For details of how personal data is collected, used, and stored, please refer to BridgeLang&apos;s Privacy Policy, accessible via the Platform and subject to updates from time to time.</p>
            <p><strong>A.21.3</strong> By using the Platform, you acknowledge that you have read and understood our Privacy Policy.</p>
          </section>

          {/* SECTION B */}
          <section id="B">
            <h2>Section B: Terms Specific to Students</h2>

            <h3 id="B1">B.1 Subscription Plans, Recurring Billing and Renewal</h3>
            <p><strong>B.1.1</strong> BridgeLang offers various subscription plans for Students, each providing a specific number of lesson credits and access to the Platform&apos;s services.</p>
            <p><strong>B.1.2</strong> Subscription plans are billed monthly on a calendar-month basis through the Student&apos;s chosen payment method.</p>
            <p><strong>B.1.3</strong> Plans will automatically renew at the end of each billing cycle unless cancelled by the Student prior to the renewal date.</p>
            <p><strong>B.1.4</strong> Students may cancel a subscription at any time via their account dashboard; however, except as required under law or expressly provided in these Terms, no prorated or partial refunds will be given for any unused portion of a subscription cancelled mid-cycle.</p>
            <p><strong>B.1.5</strong> Unless stated otherwise, prices are in GBP and include VAT where applicable. Where payment is made in a non-GBP currency, any conversion or bank charges shall be borne by the Student.</p>

            <h3 id="B2">B.2 Statutory Cancellation Rights (14-Day Cooling-Off Period)</h3>
            <h4 id="B2-1">B.2.1 Right to Cancel</h4>
            <p><strong>B.2.1.1</strong> If you are a consumer in the UK (using BridgeLang for personal learning and not as a business), you have statutory rights under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013 to cancel your purchase of services within 14 days, starting from the day after the contract is formed, without giving any reason.</p>

            <h4 id="B2-2">B.2.2 How to Cancel</h4>
            <p><strong>B.2.2.1</strong> To exercise your right of cancellation, you must notify BridgeLang in writing within the 14-day period, either via email or by using any cancellation feature in your account settings.</p>
            <p><strong>B.2.2.2</strong> You should include your account details and the specific purchase to be cancelled to expedite processing.</p>

            <h4 id="B2-3">B.2.3 Effect of Cancellation</h4>
            <p><strong>B.2.3.1</strong> If you cancel within the 14-day period and have not begun using the services, you are entitled to a full refund of any fees paid.</p>
            <p><strong>B.2.3.2</strong> BridgeLang will process refunds as soon as possible and within 14 days of receiving your notice of cancellation.</p>

            <h4 id="B2-4">B.2.4 Commencement of Services During Cooling-Off</h4>
            <p><strong>B.2.4.1</strong> If you request or choose to begin using BridgeLang services during the 14-day cooling-off period, you agree that BridgeLang may supply the services immediately.</p>
            <p><strong>B.2.4.2</strong> In such cases, if you later cancel within the 14 days, you will lose the right to a full refund. Instead, BridgeLang will deduct a proportionate amount corresponding to the services already provided.</p>

            <h4 id="B2-5">B.2.5 Expiry of Right</h4>
            <p><strong>B.2.5.1</strong> If the 14-day period has expired and/or the service has been fully delivered before a cancellation request is sent, the statutory right to cancel does not apply.</p>

            <h3 id="B3">B.3 Intellectual Property of Lesson Content</h3>
            <p><strong>B.3.1</strong> Unless otherwise agreed between a Student and a Teacher, all lesson materials and content provided or created by a Teacher remain the Teacher&apos;s intellectual property.</p>
            <p><strong>B.3.2</strong> By uploading or sharing content through the Platform, the Teacher grants BridgeLang a non-exclusive, royalty-free, worldwide licence to use such content solely for the operation of the Platform and provision of instructional services.</p>
            <p><strong>B.3.3</strong> Students and Teachers must not share or use each other&apos;s content outside the Platform without permission.</p>

            <h3 id="B4">B.4 Communication and Marketing Preferences</h3>
            <p><strong>B.4.1</strong> By creating an account, Students consent to receive essential service-related communications from BridgeLang, including booking confirmations, receipts, lesson reminders, and policy updates.</p>
            <p><strong>B.4.2</strong> BridgeLang may also send promotional communications such as newsletters, offers, and surveys.</p>
            <p><strong>B.4.3</strong> Students may opt out of promotional communications via the &quot;unsubscribe&quot; link in such messages or through account settings, but will continue to receive essential service messages.</p>

            <h3 id="B5">B.5 Lesson Credits</h3>
            <p><strong>B.5.1</strong> Lesson Credits (&quot;Credits&quot;) are the virtual currency used on the Platform to book lessons with Teachers.</p>
            <p><strong>B.5.2</strong> Credits may be purchased directly, received as part of a subscription plan, or awarded under a promotional offer.</p>
            <p><strong>B.5.3</strong> One Credit generally corresponds to one standard lesson session, as defined by BridgeLang.</p>
            <p><strong>B.5.4</strong> Credits are tied to the Student&apos;s account, have no monetary value outside the Platform, and are not refundable for cash except as required by law or expressly permitted in these Terms.</p>
            <p><strong>B.5.5</strong> Credits may have an expiry date as stated in the applicable plan or promotional terms.</p>
            <p><strong>B.5.6</strong> Upon subscription cancellation or account termination, any remaining Credits will be handled according to Section B.2.</p>

            <h3 id="B6">B.6 Booking and Cancellation</h3>
            <h4 id="B6-1">B.6.1 Standard Cancellation</h4>
            <p><strong>B.6.1.1</strong> If a Student cancels a lesson at least twenty-four (24) hours before the scheduled start time, the lesson will be cancelled without penalty and the Credits for that lesson will be returned to the Student&apos;s account.</p>

            <h4 id="B6-2">B.6.2 Late Cancellation and No-Show</h4>
            <p><strong>B.6.2.1</strong> If a Student cancels with less than 24 hours&apos; notice or fails to attend, the Teacher may decide whether the Credit is forfeited or returned.</p>
            <p><strong>B.6.2.2</strong> Teachers are encouraged to act reasonably, especially in cases of genuine emergency.</p>
            <p><strong>B.6.2.3</strong> For the purposes of this Agreement, a &quot;genuine emergency&quot; means a sudden, unforeseen, and unavoidable event beyond the reasonable control of the party affected, including but not limited to serious illness or injury, bereavement, severe weather conditions, significant technical failures (such as prolonged internet outage or platform downtime), or other Force Majeure Events as defined in Section A.12.</p>

            <h4 id="B6-3">B.6.3 Policy Enforcement</h4>
            <p><strong>B.6.3.1</strong> Repeated late cancellations may be treated as a violation of these Terms.</p>
            <p><strong>B.6.3.2</strong> BridgeLang reserves the right to review and make a final decision in cancellation disputes.</p>

            <h3 id="B7">B.7 Bonus Credits and Loyalty Incentives</h3>
            <p><strong>B.7.1</strong> BridgeLang may, at its sole discretion, offer promotional incentives such as bonus Credits, referral bonuses, or loyalty discounts.</p>
            <p><strong>B.7.2</strong> Unless otherwise specified, such incentives have no cash value, are non-transferable, and may expire if unused within the stated timeframe.</p>
            <p><strong>B.7.3</strong> BridgeLang may modify or terminate any incentive program at any time.</p>
            <p><strong>B.7.4</strong> Suspected abuse of a promotion, such as creating multiple accounts to claim Credits, may result in revocation of the Credits and other actions under these Terms.</p>

            <h3 id="B8">B.8 Platform Security and Integrity</h3>
            <p><strong>B.8.1</strong> Students are prohibited from attempting to circumvent the Platform&apos;s security measures or from arranging lessons and payments outside the Platform.</p>
            <p><strong>B.8.2</strong> Any attempt to bypass booking and payment procedures constitutes a material breach of these Terms and may result in immediate suspension or termination without refund.</p>
            <p><strong>B.8.3</strong> Students agree to use the Platform solely for its intended purposes and to promptly report any system errors or suspected security incidents to BridgeLang.</p>
          </section>

          {/* SECTION C */}
          <section id="C">
            <h2>Section C: Terms Specific to Teachers</h2>

            <h3 id="C1">C.1 DBS Checks and Eligibility</h3>
            <p><strong>C.1.1</strong> The Platform is currently intended primarily for adult students (18+). Students aged 14 to 17 may also use the Platform in accordance with Section A.3.2, provided that all safeguarding requirements are met.</p>
            <p><strong>C.1.2</strong> Teachers must meet the general eligibility requirements in Section A.3 (18 years of age or older and resident in the UK).</p>
            <p><strong>C.1.3</strong> If BridgeLang expands services to minors or vulnerable groups, it reserves the right to require DBS checks or equivalent background screening.</p>
            <p><strong>C.1.4</strong> Teachers will be notified of any new requirements and must comply to continue using the Platform.</p>
            <p><strong>C.1.5</strong> Failure to comply may result in account suspension or termination.</p>

            <h3 id="C2">C.2 Professional Obligations</h3>
            <p><strong>C.2.1</strong> Teachers must provide tutoring and teaching services to a high professional standard.</p>
            <p><strong>C.2.2</strong> This includes maintaining accurate availability calendars, honouring scheduled lessons, and providing pedagogically sound lessons tailored to Student goals and language levels.</p>
            <p><strong>C.2.3</strong> Teachers must adhere to BridgeLang&apos;s code of conduct and community guidelines, maintaining respectful and appropriate communication at all times.</p>
            <p><strong>C.2.4</strong> Lessons must focus on agreed language learning objectives and comply with applicable laws and professional standards.</p>

            <h3 id="C3">C.3 Compensation and Payment (Stripe Integration)</h3>
            <h4 id="C3-1">C.3.1 Service Fee</h4>
            <p><strong>C.3.1.1</strong> Teachers will receive 80% of the lesson fee paid by the Student; 20% is retained by BridgeLang as a service fee unless otherwise agreed in writing.</p>

            <h4 id="C3-2">C.3.2 Payment Processing</h4>
            <p><strong>C.3.2.1</strong> All payments from Students are processed through BridgeLang&apos;s designated payment processor (e.g., Stripe Connect).</p>
            <p><strong>C.3.2.2</strong> Teachers must set up and maintain a valid payment account to receive payouts.</p>

            <h4 id="C3-3">C.3.3 Payout Schedule</h4>
            <p><strong>C.3.3.1</strong> Payouts are made on a regular schedule, subject to minimum payout thresholds and any necessary withholdings for refunds or disputes.</p>

            <h4 id="C3-4">C.3.4 Tax Obligations</h4>
            <p><strong>C.3.4.1</strong> Teachers are responsible for all taxes, levies, or duties on their earnings, including registration for and payment of any applicable income tax or National Insurance contributions.</p>
            <p><strong>C.3.4.2</strong> BridgeLang does not withhold taxes but may issue payment documentation and, where required, report payments to tax authorities.</p>

            <h3 id="C4">C.4 Conduct and Restrictions</h3>
            <p><strong>C.4.1</strong> Teachers must not solicit or encourage Students to take lessons or make payments outside the Platform.</p>
            <p><strong>C.4.2</strong> All communications must be professional, courteous, and relevant to learning; harassment, hate speech, discrimination, and sexual or romantic advances are strictly prohibited.</p>
            <p><strong>C.4.3</strong> Teaching materials must be lawful and properly licensed. Intellectual property and privacy rights must be respected.</p>
            <p><strong>C.4.4</strong> Teachers must comply with all Platform policies, guidelines, and moderation rules.</p>

            <h3 id="C5">C.5 Onboarding and Verification</h3>
            <p><strong>C.5.1</strong> Teachers must complete BridgeLang&apos;s onboarding process, including identity verification and, where applicable, qualification verification.</p>
            <p><strong>C.5.2</strong> All information provided must be truthful and accurate.</p>
            <p><strong>C.5.3</strong> BridgeLang may request additional verification or documentation at any time.</p>
            <p><strong>C.5.4</strong> Failure to complete onboarding or provide requested information may result in suspension or restricted visibility.</p>
            <p><strong>C.5.5</strong> <em>Right to Work.</em> Teachers represent and warrant that they possess and will maintain any right to work in the United Kingdom required to deliver tutoring services, and shall promptly provide evidence of such status upon BridgeLang&apos;s request.</p>

            <h3 id="C6">C.6 Cancellation Policy Enforcement (Student Cancellations)</h3>
            <p><strong>C.6.1</strong> Teachers may retain the lesson Credit for cancellations made by Students with less than 24 hours&apos; notice.</p>
            <p><strong>C.6.2</strong> Teachers should apply this policy consistently and may choose to waive it in cases of genuine emergency.</p>
            <p><strong>C.6.3</strong> Patterns of Student abuse of the cancellation policy may be reported to BridgeLang for further action.</p>

            <h3 id="C7">C.7 Teacher Cancellations and No-Shows</h3>
            <p><strong>C.7.1</strong> Teachers should cancel lessons as early as possible and ideally with at least 24 hours&apos; notice.</p>
            <p><strong>C.7.2</strong> When a Teacher cancels, the Student&apos;s lesson Credit is automatically returned, and the Teacher will not be compensated.</p>
            <p><strong>C.7.3</strong> A &quot;no-show&quot; (failure to attend without cancellation) results in no payment to the Teacher and full Credit refund to the Student.</p>
            <p><strong>C.7.4</strong> Frequent cancellations or no-shows may reduce Teacher visibility, result in suspension, or lead to account termination.</p>
            <p><strong>C.7.5</strong> For the purposes of this Section, &quot;genuine emergency&quot; shall have the same meaning as defined in Section B.6.2.3.</p>

            <h3 id="C8">C.8 Lesson Preparation and Materials</h3>
            <p><strong>C.8.1</strong> Lessons must be prepared in advance and tailored to the Student&apos;s goals, proficiency level, and preferences.</p>
            <p><strong>C.8.2</strong> All materials must respect copyright and licensing requirements.</p>
            <p><strong>C.8.3</strong> Consistently low-quality preparation or feedback may trigger performance review.</p>
            <h4 id="C8-4">C.8.4 Social Media Content</h4>
            <p><strong>C.8.4.1</strong> Teachers may voluntarily submit educational or promotional content, including but not limited to vocabulary items, idioms, example sentences, short videos, images, and text posts, for use on BridgeLang&apos;s official social media accounts and website.</p>
            <p><strong>C.8.4.2</strong> The Teacher retains ownership of the Content but grants BridgeLang a royalty-free, perpetual, worldwide transferable licence to use, reproduce, distribute, display, and perform the Content in any media now known or later developed, for promotional and educational purposes.</p>
            <p><strong>C.8.4.3</strong> The Teacher warrants that the Content does not infringe any third-party rights, including copyright, trademark, or privacy rights, and does not contain unlawful, defamatory, or offensive material.</p>
            <p><strong>C.8.4.4</strong> The Teacher agrees to indemnify and hold harmless BridgeLang from any claims, damages, or expenses arising out of or related to the Content provided.</p>
            <h4 id="C8-5">C.8.5 Social Media Content Rights</h4>
            <p><strong>C.8.5.1</strong> Teachers and Students may submit educational content (including text, images, audio, and video) for use on BridgeLang&apos;s official social media accounts, such as Facebook, Instagram, and X (formerly Twitter).</p>
            <p><strong>C.8.5.2</strong> By submitting such content, the contributor grants BridgeLang a non-exclusive, royalty-free, worldwide licence to use, reproduce, modify, adapt, publish, and distribute the content across its social media platforms for promotional and educational purposes.</p>
            <p><strong>C.8.5.3</strong> BridgeLang will always credit the contributor where practicable and will not materially alter the meaning of the submitted content without prior consent.</p>

            <h3 id="C9">C.9 Performance Tracking and Badging</h3>
            <p><strong>C.9.1</strong> BridgeLang monitors Teacher performance metrics, including Student ratings, completion rates, and responsiveness.</p>
            <p><strong>C.9.2</strong> Recognition badges may be awarded for high performance at BridgeLang&apos;s discretion.</p>
            <p><strong>C.9.3</strong> Underperformance may lead to feedback, remedial steps, reduced visibility, or removal from the Platform.</p>

            <h3 id="C10">C.10 Termination of Services (Teacher Accounts)</h3>
            <p><strong>C.10.1</strong> Grounds for termination include repeated policy violations, inadequate performance, serious complaints of misconduct, and breaches of trust or safety.</p>
            <p><strong>C.10.2</strong> BridgeLang may issue warnings or allow remedies for performance issues but may terminate immediately for severe breaches.</p>
            <p><strong>C.10.3</strong> Termination results in loss of access, removal from search listings, and forfeiture of future opportunities, but payment will be made for completed lessons.</p>

            <h3 id="C11">C.11 Independent Contractor Status</h3>
            <p><strong>C.11.1</strong> Teachers act as independent contractors, not as employees, agents, or partners of BridgeLang.</p>
            <p><strong>C.11.2</strong> Teachers are responsible for their own business operations, taxes, and equipment.</p>
            <p><strong>C.11.3</strong> No employment benefits are provided, and Teachers may not bind BridgeLang in any way.</p>

            <h3 id="C12">C.12 Confidentiality and Data Handling</h3>
            <p><strong>C.12.1</strong> Teachers may only use Student personal information for the purpose of delivering lessons and must keep such information confidential.</p>
            <p><strong>C.12.2</strong> Lesson recordings require explicit consent and may only be used for agreed purposes.</p>
            <p><strong>C.12.3</strong> Teachers must not disclose any confidential or proprietary information about BridgeLang.</p>

            <h3 id="C13">C.13 Technical and Physical Teaching Requirements</h3>
            <p><strong>C.13.1</strong> For online lessons, Teachers must ensure reliable internet, suitable equipment, and an environment free from distractions.</p>
            <p><strong>C.13.2</strong> For in-person lessons, the location must be safe and conducive to learning, and arrangements must still be made and paid for via the Platform.</p>

            <h3 id="C14">C.14 In-Person Lesson Disclaimer</h3>
            <p><strong>C.14.1</strong> In-person meetings are undertaken at the risk of both Teacher and Student.</p>
            <p><strong>C.14.2</strong> BridgeLang is not responsible for any harm arising from in-person lessons.</p>
            <p><strong>C.14.3</strong> Professionalism and adherence to safety recommendations are expected in all in-person interactions.</p>
            <h4 id="C14-4">C.14.4 Safety Protocols for In-Person Lessons</h4>
            <p><strong>C.14.4.1</strong> For all in-person lessons, it is strongly recommended that the address of the lesson location be provided and recorded within the Platform&apos;s booking system prior to the lesson for the safety of both parties.</p>
            <p><strong>C.14.4.2</strong> For Students aged between fourteen (14) and seventeen (17) years old, BridgeLang policy requires written consent from a parent or legal guardian, ideally obtained and verified before the lesson takes place.</p>
            <p><strong>C.14.4.3</strong> BridgeLang strongly recommends that, for the first in-person meeting, a third party (such as a family member or friend) be present at the location.</p>
            <h4 id="C14-5">C.14.5 Insurance Requirement for Teachers</h4>
            <p><strong>C.14.5.1</strong> Teachers delivering in-person lessons should maintain adequate public liability insurance covering potential accidents, property damage, or personal injury occurring during the lesson.</p>
            <p><strong>C.14.5.2</strong> Teachers should provide proof of such insurance to BridgeLang upon request.</p>
          </section>

          {/* FINAL ACK */}
          <section id="final">
            <h2>Final Acknowledgement</h2>
            <ol>
              <li>By accessing or using the BridgeLang Platform, all Users (Students and Teachers alike) acknowledge that they have read, understood, and agree to be bound by these Terms of Use.</li>
              <li>This Agreement, together with any policies or documents incorporated by reference, constitutes the entire agreement between the User and BridgeLang UK Ltd with respect to the Platform and the services provided.</li>
              <li>It supersedes any prior agreements or understandings between the parties regarding the same subject matter.</li>
              <li>This Agreement is governed by the laws of England and Wales, and the parties submit to the exclusive jurisdiction of the courts of England and Wales, as set out in Section A.18.</li>
              <li>In the event of any dispute or claim arising out of or relating to these Terms or the use of the Platform that cannot be resolved amicably, the parties agree that the courts of England and Wales shall have exclusive jurisdiction to settle the matter.</li>
              <li>As an alternative to court proceedings, either party may propose resolving the dispute through mediation or arbitration administered in the United Kingdom, as set out in A.19. Where one party proposes mediation or arbitration, the other party shall not unreasonably refuse such proposal, and any refusal must be supported by written reasons.</li>
              <li>By using BridgeLang, you confirm that you accept these Terms and that you agree to abide by them.</li>
              <li>If you do not agree to these Terms, you must not use the Platform.</li>
            </ol>
          </section>
        </article>
      </main>
    </>
  );
}
