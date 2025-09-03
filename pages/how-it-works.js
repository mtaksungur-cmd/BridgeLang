// pages/how-it-works.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "../scss/HowItWorks.module.scss";

/** Ekran görüntülerini şu klasörlere koy:
 *  /public/screenshots/student/step-1.png  (vs.)
 *  /public/screenshots/teacher/step-1.png  (vs.)
 */
const SHOTS_STUDENT = [
  { src: "/screenshots/student/step-1.png", caption: "Choose a Plan (Starter, Pro, VIP)" },
  { src: "/screenshots/student/step-2.png", caption: "Browse teachers and open a profile" },
  { src: "/screenshots/student/step-3.png", caption: "Send messages & book with credits" },
  { src: "/screenshots/student/step-4.png", caption: "Attend online or in-person lessons" },
];

const SHOTS_TEACHER = [
  { src: "/screenshots/teacher/step-1.png", caption: "Create your profile (quals, pricing, availability)" },
  { src: "/screenshots/teacher/step-2.png", caption: "Get Paid via Stripe Connect" },
  { src: "/screenshots/teacher/step-3.png", caption: "Receive bookings & deliver lessons" },
];

export default function HowItWorks() {
  const router = useRouter();

  // SSR ile aynı HTML’i üretmek için güvenli varsayılan: 'student'
  const [role, setRole] = useState("student"); // 'student' | 'teacher'
  const [mounted, setMounted] = useState(false);

  // Rolü SADECE client’ta oku/güncelle
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
          How it works — {role === "teacher" ? "For Teachers" : "For Students"} | BridgeLang
        </title>
        <meta
          name="description"
          content="How BridgeLang works for students and teachers: plans, bookings, lessons, payments, cancellations, reviews and badges."
        />
      </Head>

      <div className={`container py-5 ${styles.page}`}>
        {/* ROL SEÇİCİ */}
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

        {/* BAŞLIK */}
        <header className="text-center mb-4">
          <h1 className="h3 fw-bold mb-2">How It Works – BridgeLang</h1>
          <p className="text-muted mb-0">
            {role === "teacher"
              ? "Create a profile, get verified, receive bookings, deliver lessons, and get paid via Stripe Connect."
              : "Choose a plan, browse teachers, book with credits, attend lessons, and grow with reviews & loyalty."}
          </p>
        </header>

        {/* İÇERİK BLOKLARI */}
        {role === "student" ? (
          <>
            {/* Plans */}
            <section className={styles.card}>
              <h2 className={styles.h2}>For Students</h2>
              <h3 className={styles.h3}>Student Subscription Plans</h3>
              <ul className={styles.list}>
                <li>
                  <strong>Choose a Plan:</strong> Select from <em>Starter</em>, <em>Pro</em>, or{" "}
                  <em>VIP</em> based on your learning goals and messaging/viewing needs.
                </li>
                <li>
                  <strong>Browse Teachers:</strong> View teacher profiles within your monthly allowance;
                  check expertise, teaching style, and availability.
                </li>
                <li>
                  <strong>Send Messages &amp; Book Lessons:</strong> Use message credits to communicate
                  and lesson credits to schedule sessions.
                </li>
                <li>
                  <strong>Attend Lessons:</strong> Online via Zoom, Google Meet or Microsoft Teams, or
                  preferably in-person.
                </li>
                <li>
                  <strong>Review Your Teacher:</strong> After your first lesson, leave a review to receive{" "}
                  <strong>1 bonus credit</strong> (first month only).
                </li>
                <li>
                  <strong>Stay Consistent:</strong> Keep your subscription to earn loyalty bonuses and get
                  exclusive discounts on the VIP plan.
                </li>
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
            {/* Teachers */}
            <section className={styles.card}>
              <h2 className={styles.h2}>For Teachers</h2>
              <ul className={styles.list}>
                <li>
                  <strong>Create Your Profile:</strong> Add qualifications, experience, lesson types
                  (online or in-person), pricing and availability.
                </li>
                <li>
                  <strong>Verification &amp; Approval:</strong> Your profile is reviewed by the BridgeLang
                  team. Once approved, it becomes visible to students.
                </li>
                <li>
                  <strong>Receive Bookings:</strong> Students book based on your availability. You’ll get
                  notifications via email and your dashboard.
                </li>
                <li>
                  <strong>Deliver Lessons:</strong> Run sessions online (Zoom, Google Meet, Microsoft Teams)
                  or in-person. Be punctual and prepared.
                </li>
                <li>
                  <strong>Get Paid via Stripe Connect:</strong> Secure payouts; you receive{" "}
                  <strong>80%</strong> of the lesson fee automatically after the session. BridgeLang
                  retains <strong>20%</strong>.
                </li>
                <li>
                  <strong>Cancellation Policy:</strong> Students can cancel up to <strong>24 hours</strong>{" "}
                  in advance. Late cancellations/no-shows may be fully charged at your discretion.
                </li>
              </ul>
            </section>

            <section className={styles.card}>
              <h3 className={styles.h3}>Earn Recognition Badges</h3>
              <p className="mb-2">Consistency and high ratings unlock teacher recognition badges.</p>
              <ul className={styles.list}>
                <li><strong>Reviews &amp; Visibility:</strong> After each lesson, students leave feedback. Strong ratings boost your visibility.</li>
                <li><strong>Grow Your Brand:</strong> Stay responsive, maintain high quality, and keep a consistent schedule.</li>
              </ul>
            </section>

            {/* Carousel */}
            <section className="mt-4">
              <h3 className={`${styles.h3} text-center mb-3`}>See it in action</h3>
              <div id="roleShots" className={`carousel slide ${styles.carouselWrap}`} data-bs-ride="carousel">
                <div className={`carousel-inner rounded shadow-sm ${styles.carouselInner}`}>
                  {SHOTS.map((s, i) => (
                    <div className={`carousel-item ${i === 0 ? "active" : ""}`} key={s.src}>
                      <img src={s.src} className={`d-block w-100 ${styles.shot}`} alt={s.caption} />
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
