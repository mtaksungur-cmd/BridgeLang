// pages/how-it-works.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "../scss/HowItWorks.module.scss";

import StudentOnboardingVideo from "../components/videos/StudentOnboardingVideo";
import TeacherOnboardingVideo from "../components/videos/TeacherOnboardingVideo";

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
              : "Learn real-life English for your life in the UK — with verified tutors who understand British workplaces, healthcare, education and everyday communication. Choose your plan, book lessons your way, and enjoy loyalty rewards as you build lasting confidence."}
          </p>
        </header>

        {/* STUDENT CONTENT */}
        {role === "student" ? (
          <>
            {/* STUDENT VIDEO */}
            <StudentOnboardingVideo videoId="P2y8ftutxX0" />

            <section className={styles.card}>
              <h2 className={styles.h2}>For Students</h2>
              <p>
                Create your free account to access  verified tutors with real UK experience.
                Whether you are preparing for a job interview, GP appointment, workplace communication or daily conversations, BridgeLang helps you learn the English you truly need for life in the UK.
              </p>
              <ul className={styles.list}>
                <li><strong>Step 1 – Choose Your Plan:</strong> Select the Free, Starter, Pro, or VIP plan — designed to support different stages of your UK journey.</li>
                <li><strong>Step 2 – Find Your Tutor:</strong> Discover verified UK-experienced tutors. Filter by your goals, such as job interviews, workplace English, healthcare English, daily communication or general skills.</li>
                <li><strong>Step 3 – Book &amp; Pay Securely:</strong> Choose a time that fits your UK schedule. All payments are handled safely via Stripe.</li>
                <li><strong>Step 4 – Learn with  Confidence:</strong> Take lessons online or face-to-face and practise the real English you'll use in British workplaces, public services and everyday life.</li>
                <li><strong>Step 5 – Earn Rewards:</strong> Earn loyalty points, first-lesson savings and ongoing learning rewards that help you progress with consistency.</li>
              </ul>
            </section>

            {/* STUDENT CAROUSEL */}
            <section className="mt-4">
              <h3 className={`${styles.h3} text-center mb-3`}>Experience BridgeLang in Action!</h3>
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
                  <span className="carousel-control-prev-icon"></span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#roleShots" data-bs-slide="next">
                  <span className="carousel-control-next-icon"></span>
                </button>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* TEACHER VIDEO */}
            <TeacherOnboardingVideo videoId="opff15raLa4" />

            {/* TEACHER CONTENT */}
            <section className={styles.card}>
              <h2 className={styles.h2}>For Teachers</h2>
              <p>
                Share your expertise with motivated learners. BridgeLang makes scheduling, payments, and communication easy.
              </p>
              <ul className={styles.list}>
                <li><strong>Step 1 – Apply to Teach:</strong> Send your application with experience & qualifications.</li>
                <li><strong>Step 2 – Build Your Profile:</strong> Upload photo, bio, set your rates, track lessons.</li>
                <li><strong>Step 3 – Connect Payments:</strong> Stripe Connect handles secure payouts.</li>
              </ul>
            </section>

            {/* TEACHER CAROUSEL */}
            <section className="mt-4">
              <h3 className={`${styles.h3} text-center mb-3`}>Experience BridgeLang in Action!</h3>
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
                  <span className="carousel-control-prev-icon"></span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#roleShots" data-bs-slide="next">
                  <span className="carousel-control-next-icon"></span>
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
