// pages/how-it-works.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "../scss/HowItWorks.module.scss";

/* ------------------ SCREENSHOTS ------------------ */
const SHOTS_STUDENT = [
  { src: "/screenshots/student/step-1.png", caption: "Step 1 – Choose Your Plan" },
  { src: "/screenshots/student/step-2.png", caption: "Step 2 – Find Your Tutor" },
  { src: "/screenshots/student/step-3.png", caption: "Step 3 – Book & Pay Securely" },
  { src: "/screenshots/student/step-4.png", caption: "Step 4 – Learn Confidently" },
  { src: "/screenshots/student/step-5.png", caption: "Step 5 – Earn Rewards as You Learn" },
];

const SHOTS_TEACHER = [
  { src: "/screenshots/teacher/step-1.png", caption: "Step 1 – Apply to Teach" },
  { src: "/screenshots/teacher/step-2.png", caption: "Step 2 – Build Your Profile & Manage Teaching" },
  { src: "/screenshots/teacher/step-3.png", caption: "Step 3 – Connect Your Payments" },
];

/* ------------------ COMPONENT ------------------ */
export default function HowItWorks() {
  const router = useRouter();
  const [role, setRole] = useState("student");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const qRole = typeof router.query.role === "string" ? router.query.role : "student";
    setRole(qRole === "teacher" ? "teacher" : "student");
  }, [router.query.role]);

  const SHOTS = useMemo(() => (role === "teacher" ? SHOTS_TEACHER : SHOTS_STUDENT), [role]);

  const switchRole = (next) => {
    if (!mounted) return;
    setRole(next);
    const qs = new URLSearchParams(window.location.search);
    qs.set("role", next);
    const url = `${window.location.pathname}?${qs.toString()}`;
    window.history.replaceState(null, "", url);
  };

  return (
    <>
      <Head>
        <title>
          How It Works — {role === "teacher" ? "For Teachers" : "For Students"} | BridgeLang
        </title>
        <meta
          name="description"
          content="How BridgeLang works for students and teachers: subscriptions, lessons, payments, and rewards."
        />
      </Head>

      <div className={`container py-5 ${styles.page}`}>
        {/* ROLE SWITCH */}
        <div className="text-center mb-4">
          <div className="btn-group" role="group" aria-label="Role switch">
            <button
              type="button"
              className={`btn ${role === "student" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => switchRole("student")}
            >
              I’m a Student
            </button>
            <button
              type="button"
              className={`btn ${role === "teacher" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => switchRole("teacher")}
            >
              I’m a Teacher
            </button>
          </div>
        </div>

        {/* HEADER */}
        <header className="text-center mb-4">
          <h1 className="h3 fw-bold mb-2">How It Works – BridgeLang</h1>
          <p className="text-muted mb-0">
            {role === "teacher"
              ? "Teach English online or in person. Build your profile, manage lessons, and get paid securely via Stripe Connect."
              : "Learn English your way — online or face-to-face. Choose your plan, find tutors, book lessons, and earn rewards as you learn."}
          </p>
        </header>

        {/* CONTENT */}
        {role === "student" ? (
          <>
            <section className={styles.card}>
              <h2 className={styles.h2}>For Students</h2>
              <p>
                Create your free account, explore verified English tutors, and choose how you want to learn.
                If you don’t select a subscription, you’ll automatically start with the Free Plan.
              </p>
              <ul className={styles.list}>
                <li><strong>Step 1 – Choose Your Plan:</strong> Free, Starter, Pro, or VIP.</li>
                <li><strong>Step 2 – Find Your Tutor:</strong>  Filter by English level, learning goals, and method of delivery.</li>
                <li><strong>Step 3 – Book & Pay Securely:</strong> Payments are processed safely via Stripe.</li>
                <li><strong>Step 4 – Learn Confidently:</strong> Join online or meet in person.</li>
                <li><strong>Step 5 – Earn Rewards:</strong> Earn loyalty points, discounts, and special coupons as you keep learning.</li>
              </ul>
            </section>

            {/* Carousel */}
            <section className="mt-4">
              <h3 className={`${styles.h3} text-center mb-3`}>See it in action</h3>
              <div id="roleShots" className={`carousel slide ${styles.carouselWrap}`} data-bs-ride="carousel">
                <div className={`carousel-inner rounded shadow-sm ${styles.carouselInner}`}>
                  {SHOTS.map((s, i) => (
                    <div className={`carousel-item ${i === 0 ? "active" : ""}`} key={s.src}>
                      <div className={styles.shotBox}>
                        <img src={s.src} className={styles.shotImg} alt={s.caption} />
                      </div>
                      <div className={`carousel-caption ${styles.captionAlways}`}>
                        <p className={styles.captionText}>{s.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="carousel-control-prev" type="button" data-bs-target="#roleShots" data-bs-slide="prev">
                  <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#roleShots" data-bs-slide="next">
                  <span className="carousel-control-next-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Next</span>
                </button>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className={styles.card}>
              <h2 className={styles.h2}>For Teachers</h2>
              <p>
                Share your expertise with motivated learners. BridgeLang simplifies scheduling, payments,
                and communication — all in one place.
              </p>
              <ul className={styles.list}>
                <li><strong>Step 1 – Apply to Teach:</strong> Submit your application with experience and qualifications.</li>
                <li><strong>Step 2 – Build Your Profile & Manage Teaching:</strong> Upload your photo, bio, set your rates, and track your lessons and reviews easily.</li>
                <li><strong>Step 3 – Connect Your Payments:</strong> Link Stripe once, and receive payouts automatically after completed lessons.</li>
              </ul>
            </section>

            {/* Carousel */}
            <section className="mt-4">
              <h3 className={`${styles.h3} text-center mb-3`}>See it in action</h3>
              <div id="roleShots" className={`carousel slide ${styles.carouselWrap}`} data-bs-ride="carousel">
                <div className={`carousel-inner rounded shadow-sm ${styles.carouselInner}`}>
                  {SHOTS.map((s, i) => (
                    <div className={`carousel-item ${i === 0 ? "active" : ""}`} key={s.src}>
                      <div className={styles.shotBox}>
                        <img src={s.src} className={styles.shotImg} alt={s.caption} />
                      </div>
                      <div className={`carousel-caption ${styles.captionAlways}`}>
                        <p className={styles.captionText}>{s.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="carousel-control-prev" type="button" data-bs-target="#roleShots" data-bs-slide="prev">
                  <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#roleShots" data-bs-slide="next">
                  <span className="carousel-control-next-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Next</span>
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
