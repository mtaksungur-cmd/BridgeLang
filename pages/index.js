import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import styles from "../scss/Home.module.scss";

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
              Start learning English the smart way — online or in person. Secure payments, flexible lessons, and real progress with friendly UK-based tutors. Start learning today — your first step to fluent, confident English.
            </p>
            <div>
              <Link
                href="/student/register"
                className={`btn btn-primary me-2 ${styles.heroBtnPrimary}`}
              >
                Start Learning Today
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

        {/* HOW IT WORKS */}
        <section className={`mt-5 ${styles.howItWorks}`}>
          <h2 className="h3 fw-bold text-center mb-4">How it works</h2>
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
                  Pick a time that works. Pay with Stripe. You&apos;ll get instant booking confirmation and calendar invites.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className={styles.howCard}>
                <h5>3) Learn &amp; Review</h5>
                <p className="mb-0">
                  Meet online via Daily.co or in person. After both confirm the lesson, the tutor is paid. Leave a review to help others.
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
                  Each tutor completes an onboarding check and profile review. We spotlight active, well-reviewed teachers.
                </p>
              </div>
            </div>
            <div className="col-md-6">
              <div className={styles.highlightBox}>
                <h6 className="mb-2">Flexible lesson types</h6>
                <p className="mb-0">
                  Online or in person. IELTS/TOEFL prep, conversation practice, business English and more.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING TEASER */}
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

        {/* TESTIMONIALS */}
{/*
       <section className={`mt-5 ${styles.testimonials}`}>
          <h2 className="h4 fw-bold mb-3">What learners say</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className={styles.testimonialCard}>
                “Booking was effortless and my tutor adapted the lesson to my job interviews.” — Emma P.
              </div>
            </div>
            <div className="col-md-4">
              <div className={styles.testimonialCard}>
                “I like that payments are safe and released only after we both confirm.” — Daniel C.
              </div>
            </div>
            <div className="col-md-4">
              <div className={styles.testimonialCard}>
                “The video lessons work smoothly and messaging is super quick.” — Aisha R.
              </div>
            </div>
          </div>
        </section>
        */}

        {/* FAQ TEASER */}
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

        {/* FINAL CTA */}
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
