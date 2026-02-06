import Link from "next/link";
import Image from "next/image";
import styles from "../scss/Home.module.scss";
import GeneralIntroVideo from "../components/videos/GeneralIntroVideo";
import PricingTable from "../components/PricingTable";
import SeoHead from "../components/SeoHead";

const trustPoints = [
  {
    title: "Real, UK-Based Professional ESL Teachers",
    desc: "Learn exclusively from independent, verified ESL teachers living in the United Kingdom. Every teacher undergoes identity and qualification checks, ensuring authentic UK English, accurate pronunciation and culturally relevant communication skills."
  },
  {
    title: "Manually Reviewed & Approved Teachers",
    desc: "BridgeLang personally reviews and approves each teacher application. Only trusted, qualified professionals become part of the community — no instant sign-ups, no unverified profiles."
  },
  {
    title: "A UK-Only Learning Environment",
    desc: "BridgeLang is designed exclusively for learners and teachers based in the UK. This ensures cultural relevance, shared time zones, smoother communication and a safer space free from global spam or scams."
  },
  {
    title: "Safe, Professional Space for Adult Learners",
    desc: "The platform is primarily for adult learners in the UK. Learners aged 14–17 can join only with parental consent. This creates a mature, respectful and secure educational environment."
  },
  {
    title: "Personalised 1-to-1 Lessons",
    desc: "Each lesson is tailored to your personal goals — fluency, job interviews, workplace English, confidence in daily communication or accent improvement. No generic one-size-fits-all paths."
  },
  {
    title: "Payments Processed Securely via Stripe",
    desc: "Learners always pay the exact lesson price displayed on the platform — with no hidden fees, no additional charges and no unexpected costs. BridgeLang ensures a clear, simple and transparent payment experience for every learner."
  },
  {
    title: "Flexible Scheduling for Busy UK Life",
    desc: "Book lessons at times that fit your schedule — mornings, evenings or weekends. Reschedule easily and without stress. Ideal for UK professionals, parents, students and shift workers."
  },
  {
    title: "Instant Booking — No Waiting Time",
    desc: "Start learning immediately. Choose your teacher, book your lesson and begin. No approval delays, no complicated processes."
  },
  {
    title: "Faster, Real-Life Results",
    desc: "1-to-1 lessons accelerate progress significantly compared to group classes. Improve your English for real UK situations — workplace interactions, job interviews, NHS appointments, school communication and daily conversation."
  },
  {
    title: "Fully GDPR-Compliant Data Protection",
    desc: "Your personal information, learning history and payment data are protected with full GDPR compliance. Privacy and data security are core commitments."
  },
  {
    title: "Registered UK Company",
    desc: "BridgeLang Ltd is a legally registered company in the United Kingdom (Company No. 16555217). This provides learners with transparency, legal accountability and long-term trust."
  },
  {
    title: "Real Business Presence in the UK",
    desc: "BridgeLang operates from a verifiable UK business address: The Apex, Derriford Business Park, Brest Road, Plymouth, PL6 5FL. A real company with a real UK presence — not an anonymous online platform."
  },
  {
    title: "Secure Payments with Stripe",
    desc: "Stripe's trusted global infrastructure ensures your transactions are protected, encrypted and compliant with UK financial standards."
  },
  {
    title: "More Choice, More Value",
    desc: "Independent teachers offer a wider variety of teaching styles, experience levels and price points — giving learners more flexibility, more affordability and more control."
  },
  {
    title: "Authentic UK Cultural Integration Support",
    desc: "Lessons help learners become confident and culturally aware in real UK life. Perfect for newcomers, job seekers and long-term residents wanting to feel more connected."
  },
  {
    title: "Real Human Support — Not Bots",
    desc: "Receive fast, personal and human assistance whenever you need help. No automated responses, no scripted chatbot interactions."
  },
  {
    title: "Consistent Mission & Educational Integrity",
    desc: "Guided by the mission: \"Bridging Cultures. Building Confidence. Belonging in the UK.\" BridgeLang supports learners in feeling understood, confident and connected in their everyday UK life."
  },
  {
    title: "Clear, Measurable Learning Outcomes",
    desc: "BridgeLang focuses on helping learners build confidence, improve fluency and communicate more effectively in UK-specific situations. Outcomes include clearer communication, improved vocabulary, stronger pronunciation and increased confidence in workplace and daily interactions."
  },
  {
    title: "Clear Terms, Policies and Teacher Guidelines",
    desc: "Transparent terms of use, clear privacy information and professional teaching guidelines ensure predictable, safe and high-quality interactions for both learners and teachers."
  },
  {
    title: "Visible and Transparent Online Presence",
    desc: "BridgeLang maintains a consistent and professional online presence through its website and social platforms — reinforcing trust, accountability and long-term commitment to learners across the UK."
  }
];

export default function Home() {
  return (
    <>
      <SeoHead />

      <div className={styles.page}>
        {/* ——— HERO SECTION ——— */}
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroCard}>
              <div className={styles.heroGrid}>
                <div className={styles.heroContent}>
                  <h1 className={styles.heroTitle}>
                    Real UK English for Real Life in the UK
                  </h1>
                  <p className={styles.heroLead}>
                    Learn practical English for everyday life in the UK with trusted, UK-based tutors.
                  </p>
                  <div className={styles.heroBtns}>
                    <Link href="/student/register" className={styles.btnPrimary}>
                      Start Learning Today
                    </Link>
                    <Link href="/how-it-works" className={styles.btnSecondary}>
                      How It Works
                    </Link>
                  </div>
                </div>
                <div className={styles.heroImage}>
                  <Image
                    src="/bridgelang.png"
                    alt="BridgeLang - UK English learning"
                    width={560}
                    height={380}
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ——— TRUST SECTION (20 POINTS) ——— */}
        <section className={styles.trust}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Why Learners Trust BridgeLang</h2>
            <div className={styles.featureGrid}>
              {trustPoints.map((point, i) => (
                <div key={i} className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>
                    {i + 1}. {point.title}
                  </h3>
                  <p className={styles.featureDesc}>{point.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ——— INTRO VIDEO ——— */}
        <section style={{ padding: '3rem 0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
            <GeneralIntroVideo videoId="IIVHGzE4Z1I" />
          </div>
        </section>

        {/* ——— VERIFICATION SECTION ——— */}
        <section style={{ padding: '3rem 0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
            <div className={styles.verifySection}>
              <h2>How We Verify Our Tutors</h2>
              <p>
                All tutors on BridgeLang are fully verified before their profiles go live. Every tutor goes through a manual review process carried out by the BridgeLang team.
              </p>
              <ul>
                <li>
                  <span>✔</span>
                  <strong>Identity check</strong>&nbsp;We review each tutor's ID document and profile photo to ensure authenticity.
                </li>
                <li>
                  <span>✔</span>
                  <strong>Qualification review</strong>&nbsp;We manually check teaching certificates, training documents and relevant education.
                </li>
                <li>
                  <span>✔</span>
                  <strong>Experience confirmation</strong>&nbsp;We ensure tutors meet our teaching standards and have suitable background for the subjects they offer.
                </li>
                <li>
                  <span>✔</span>
                  <strong>Profile quality check</strong>&nbsp;We verify accuracy, clarity and professionalism in every tutor profile.
                </li>
                <li>
                  We accept only verified tutors — no random sign-ups, no unverified accounts.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ——— HOW IT WORKS ——— */}
        <section className={styles.howItWorks}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>How It Works</h2>
            <div className={styles.stepsGrid}>
              <div className={styles.stepCard}>
                <h5>1) Search & Message</h5>
                <p>
                  Browse verified UK tutors, check availability and send a safe
                  in-app message to discuss your goals.
                </p>
              </div>
              <div className={styles.stepCard}>
                <h5>2) Book & Pay</h5>
                <p>
                  Pick a time that works. Pay with Stripe.
                </p>
              </div>
              <div className={styles.stepCard}>
                <h5>3) Learn & Review</h5>
                <p>
                  Meet your tutor online via BridgeLang Live — or in person.
                  Leave a quick review to help others start their English journey.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ——— PRICING TABLE ——— */}
        <section style={{ padding: '3rem 0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
            <PricingTable />
          </div>
        </section>

        {/* ——— TUTOR HIGHLIGHTS ——— */}
        <section className={styles.tutorHighlights}>
          <div className={styles.container}>
            <h2>Why Our Tutors?</h2>
            <div className={styles.highlightGrid}>
              <div className={styles.highlightBox}>
                <h6>Verified UK-focused professionals</h6>
                <p>
                  Every tutor is carefully reviewed and approved to teach practical, real-life English for living, working and integrating in the UK.
                </p>
              </div>
              <div className={styles.highlightBox}>
                <h6>Independent, experienced educators</h6>
                <p>
                  Our tutors set their own rates, teaching style and focus — so you learn from confident professionals who truly own their expertise.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ——— FAQ ——— */}
        <section style={{ padding: '3rem 0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
            <div className={styles.faqBox}>
              <h3>Have questions?</h3>
              <p>
                Read our quick FAQ to learn about refunds, rescheduling and safety.
              </p>
              <Link href="/faq">
                Read FAQ
              </Link>
            </div>
          </div>
        </section>

        {/* ——— FINAL CTA ——— */}
        <section style={{ padding: '3rem 0 4rem' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
            <div className={styles.finalCta}>
              <h2>Ready to start?</h2>
              <p>
                Create your free account and book your first lesson today.
              </p>
              <Link href="/student/register" className={styles.btnPrimary}>
                Create account
              </Link>
              <div className={styles.ctaSubtext}>
                Free to join. No commitment. Cancel anytime.<br />
                Automatic discounts and loyalty rewards apply.
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
