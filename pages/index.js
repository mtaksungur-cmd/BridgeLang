import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import styles from "../scss/Home.module.scss";
import GeneralIntroVideo from "../components/videos/GeneralIntroVideo";

export default function Home() {
  return (
    <>
      <Head>
        <title>BridgeLang – Learn English with verified UK tutors</title>
        <meta
          name="description"
          content="Book online or in-person English lessons with verified UK tutors. Secure payments, safe messaging, flexible scheduling and affordable prices."
        />
      </Head>

      <div className={`container py-5 ${styles.homePage}`}>
        
        {/* HERO */}
        <div className="row align-items-center g-4">
          <div className="col-lg-6">
            <h1 className={`display-5 fw-bold ${styles.heroTitle}`}>
              Improve Your English and Feel at Home in the UK
            </h1>
            <p className={`lead mb-4 ${styles.heroLead}`}>
              Start learning English the smart way — online or in person. Secure payments,
              flexible lessons, and real progress with friendly UK-based tutors.
            </p>
            <div>
              <Link
                href="/student/register"
                className={`btn btn-primary me-2 ${styles.heroBtnPrimary}`}
              >
                Create Your Free Account
              </Link>
              <Link
                href="/how-it-works"
                className={`btn btn-outline-secondary ${styles.heroBtnSecondary}`}
              >
                How It Works
              </Link>
            </div>
          </div>

          <div className="col-lg-6 text-center">
            <Image
              src="/bridgelang.png"
              alt="A tutor helping a student learn English"
              width={560}
              height={380}
              className="img-fluid rounded shadow-sm"
              priority
            />
          </div>
        </div>

        {/* ===========================
            WHY LEARNERS TRUST BRIDGELANG
        =========================== */}
        <section className={`mt-5 ${styles.trustSection}`}>
          <h2 className="h3 fw-bold text-center mb-4">
            Why Learners Trust BridgeLang
          </h2>

          <div className="row g-4">
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>1. Real, UK-Based Professional ESL Teachers</h6>
                <p>
                  Learn exclusively from independent, verified ESL teachers living in the United Kingdom. Every teacher undergoes identity and qualification checks, ensuring authentic UK English, accurate pronunciation and culturally relevant communication skills.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>2. Manually Reviewed & Approved Teachers</h6>
                <p>
                  BridgeLang personally reviews and approves each teacher application. Only trusted, qualified professionals become part of the community — no instant sign-ups, no unverified profiles.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>3. A UK-Only Learning Environment</h6>
                <p>
                  BridgeLang is designed exclusively for learners and teachers based in the UK. This ensures cultural relevance, shared time zones, smoother communication and a safer space free from global spam or scams.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>4. Safe, professional space for adult learners</h6>
                <p>
                  The platform is primarily for adult learners in the UK. Learners aged 14–17 can join only with parental consent. This creates a mature, respectful and secure educational environment.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>5. Personalised 1-to-1 Lessons</h6>
                <p>
                  Each lesson is tailored to your personal goals — fluency, job interviews, workplace English, confidence in daily communication or accent improvement. No generic one-size-fits-all paths.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>6. Payments are processed securely via Stripe.</h6>
                <p>
                  Learners always pay the exact lesson price displayed on the platform — with no hidden fees, no additional charges and no unexpected costs.
                  BridgeLang ensures a clear, simple and transparent payment experience for every learner.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>7. Flexible Scheduling for Busy UK Life</h6>
                <p>
                  Book lessons at times that fit your schedule — mornings, evenings or weekends. Reschedule easily and without stress. Ideal for UK professionals, parents, students and shift workers.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>8. Instant Booking — No Waiting Time</h6>
                <p>
                  Start learning immediately. Choose your teacher, book your lesson and begin. No approval delays, no complicated processes.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>9. ⁠Faster, Real-Life Results</h6>
                <p>
                  1-to-1 lessons accelerate progress significantly compared to group classes. Improve your English for real UK situations — workplace interactions, job interviews, NHS appointments, school communication and daily conversation.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>10. Fully GDPR-Compliant Data Protection</h6>
                <p>
                  Your personal information, learning history and payment data are protected with full GDPR compliance. Privacy and data security are core commitments.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>11. ⁠Registered UK Company</h6>
                <p>
                  BridgeLang UK Ltd is a legally registered company in the United Kingdom (Company No. 16555217). This provides learners with transparency, legal accountability and long-term trust.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>12. Real Business Presence in the UK</h6>
                <p>
                  BridgeLang operates from a verifiable UK business address:
                  The Apex, Derriford Business Park, Brest Road, Plymouth, PL6 5FL.
                  A real company with a real UK presence — not an anonymous online platform.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>13. ⁠Secure Payments with Stripe</h6>
                <p>
                  Stripe’s trusted global infrastructure ensures your transactions are protected, encrypted and compliant with UK financial standards.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>14. More Choice, More Value</h6>
                <p>
                  Independent freelance teachers offer a wider variety of teaching styles, experience levels and price points — giving learners more flexibility, more affordability and more control.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>15. ⁠Authentic UK Cultural Integration Support</h6>
                <p>
                  Lessons help learners become confident and culturally aware in real UK life. Perfect for newcomers, job seekers and long-term residents wanting to feel more connected.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>16. ⁠Real Human Support — Not Bots</h6>
                <p>
                  Receive fast, personal and human assistance whenever you need help. No automated responses, no scripted chatbot interactions.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>17. Consistent Mission & Educational Integrity</h6>
                <p>
                  Guided by the mission: “Bridging Cultures. Building Confidence. Belonging in the UK.”
                  BridgeLang supports learners in feeling understood, confident and connected in their everyday UK life.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>18. Clear, Measurable Learning Outcomes</h6>
                <p>
                  BridgeLang focuses on helping learners build confidence, improve fluency and communicate more effectively in UK-specific situations.
                  Outcomes include clearer communication, improved vocabulary, stronger pronunciation and increased confidence in workplace and daily interactions.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>19. ⁠Clear Terms, Policies and Teacher Guidelines</h6>
                <p>
                  Transparent terms of use, clear privacy information and professional teaching guidelines ensure predictable, safe and high-quality interactions for both learners and teachers.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.trustCard}>
                <h6>20. Visible and Transparent Online Presence</h6>
                <p>
                  BridgeLang maintains a consistent and professional online presence through its website and social platforms — reinforcing trust, accountability and long-term commitment to learners across the UK.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===========================
            🎥 INTRO VIDEO (NEW)
        ============================ */}
        <GeneralIntroVideo videoId="IIVHGzE4Z1I" />


        {/* HOW IT WORKS */}
        <section className={`mt-5 ${styles.howItWorks}`}>
          <h2 className="h3 fw-bold text-center mb-4">How It Works</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className={styles.howCard}>
                <h5>1) Search &amp; Message</h5>
                <p className="mb-0">
                  Browse verified UK tutors, check availability, and send a safe
                  in-app message to discuss your goals.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className={styles.howCard}>
                <h5>2) Book &amp; Pay</h5>
                <p className="mb-0">
                  Pick a time that works. Pay with Stripe.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className={styles.howCard}>
                <h5>3) Learn &amp; Review</h5>
                <p className="mb-0">
                  Meet your tutor online via BridgeLang Live — or in person.
                  Leave a quick review to help others start their English journey.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TUTOR HIGHLIGHTS */}
        <section className={`mt-5 ${styles.tutorHighlights}`}>
          <h2 className="h4 fw-bold mb-3">Why our tutors?</h2>
          <div className="row g-4">
            <div className="col-md-6">
              <div className={styles.highlightBox}>
                <h6 className="mb-2">Verified &amp; supported</h6>
                <p className="mb-0">
                  Each tutor completes an onboarding check and profile review.
                </p>
              </div>
            </div>
            <div className="col-md-6">
              <div className={styles.highlightBox}>
                <h6 className="mb-2">Flexible lesson types</h6>
                <p className="mb-0">
                  Online or in person. IELTS/TOEFL prep, conversation practice, Business English.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className={`mt-5 ${styles.pricing}`}>
          <div
            className={`p-4 rounded-3 border bg-light d-md-flex align-items-center justify-content-between ${styles.pricingBox}`}
          >
            <div>
              <h3 className="h4 fw-bold mb-1">Simple plans for learners</h3>
              <p className="mb-0">
                Starter, Pro, and VIP — pick what fits your learning pace.
              </p>
            </div>
            <Link href="/student/subscription" className="btn btn-primary mt-3 mt-md-0">
              View plans
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className={`mt-5 ${styles.faq}`}>
          <div className={styles.faqBox}>
            <h3 className="h5 fw-bold mb-2">Have questions?</h3>
            <p className="mb-3">
              Read our quick FAQ to learn about refunds, rescheduling, and safety.
            </p>
            <Link href="/faq" className="btn btn-outline-secondary">
              Read FAQ
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.finalCta}>
          <h2 className="h3 fw-bold mb-2">Ready to start?</h2>
          <p className="mb-3">
            Create a free account and book your first lesson today.
          </p>
          <Link href="/student/register" className="btn btn-primary">
            Create account
          </Link>
        </section>
      </div>
    </>
  );
}
