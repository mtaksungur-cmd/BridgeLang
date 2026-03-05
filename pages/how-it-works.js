// pages/how-it-works.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import styles from "../scss/HowItWorks.module.scss";
import SeoHead from "../components/SeoHead";
import useSeoData from "../lib/useSeoData";

import StudentOnboardingVideo from "../components/videos/StudentOnboardingVideo";
import TeacherOnboardingVideo from "../components/videos/TeacherOnboardingVideo";

/* ————— SCREENSHOTS ————— */
const SHOTS_STUDENT = [
  {
    src: "/screenshots/student/step-1.png?v=5",
    caption: "Step 1 – Start with Free Access",
    description: "No subscription. No upfront cost. Browse tutors, view profiles, and message tutors before booking. Start for free or try a 15-min intro lesson for £4.99."
  },
  {
    src: "/screenshots/student/step-2.png?v=5",
    caption: "Step 2 – Find the Tutor That Fits You",
    description: "Browse verified UK-based tutors. No commitment. You can switch tutors anytime — even on the Free Plan."
  },
  {
    src: "/screenshots/student/step-3.png?v=5",
    caption: "Step 3 – Chat with Your Teacher",
    description: "Introduce yourself or ask about lesson availability. Most tutors reply within 24 hours. All messages stay within the platform."
  },
  {
    src: "/screenshots/student/step-4.png?v=5",
    caption: "Step 4 – Book Your First Lesson in Minutes",
    description: "Choose 15/30/45/60-minute lessons. Pay only for the lesson you book — no membership fees. Intro lesson credit applies to your next booking."
  },
  {
    src: "/screenshots/student/step-5.png?v=5",
    caption: "Step 5 – Join Your Live Lesson",
    description: "Check your camera and microphone before joining. No downloads needed. Runs directly in your browser."
  }
];

const SHOTS_TEACHER = [
  {
    src: "/screenshots/teacher/step-1.png?v=5",
    caption: "Step 1 – Create Your Teaching Profile",
    description: "Start by creating your profile. Our team reviews applications within 1 business day. UK-focused learners, fair pricing, Stripe Connect secure payments."
  },
  {
    src: "/screenshots/teacher/step-2.png?v=5",
    caption: "Step 2 – Complete Your Profile & Set Your Lesson Details",
    description: "Set your availability, lesson durations, and prices to start teaching. Actual dashboards may vary based on user role and settings."
  },
  {
    src: "/screenshots/teacher/step-3.png?v=5",
    caption: "Step 3 – Connect Your Payments Securely",
    description: "Payments are handled securely via Stripe Connect. Your earnings are paid directly to your bank account. BridgeLang never holds your money."
  },
  {
    src: "/screenshots/teacher/step-4.png?v=5",
    caption: "Step 4 – Start Teaching Learners Across the UK",
    description: "Teach online or in person. Flexible schedule, secure payments, and a platform built for professionals. Start teaching today."
  }
];

export default function HowItWorks() {
  const router = useRouter();
  const [activeInfo, setActiveInfo] = useState({});
  const [role, setRole] = useState("student");
  const [mounted, setMounted] = useState(false);
  const { h1: seoH1 } = useSeoData();

  useEffect(() => {
    setMounted(true);
    if (router.isReady) {
      if (router.query.role === "teacher") setRole("teacher");
      else setRole("student");
    }
  }, [router.isReady, router.query.role]);

  const SHOTS = useMemo(() => (role === "teacher" ? SHOTS_TEACHER : SHOTS_STUDENT), [role]);

  const toggleInfo = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveInfo(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleRoleSwitch = (e, targetRole) => {
    e.preventDefault();
    e.stopPropagation();
    setRole(targetRole);
    router.push(`/how-it-works?role=${targetRole}`, undefined, { shallow: true });
    setActiveInfo({});
  };

  if (!mounted) return null;

  return (
    <>
      <SeoHead
        title={`How It Works — ${role === "teacher" ? "For Teachers" : "For Students"} | BridgeLang`}
        description="Discover how easy it is to start learning English on BridgeLang. Browse verified UK tutors, book a 15-minute intro lesson, join live sessions, and track your progress."
      />

      <div className={`container py-5 ${styles.page}`}>
        {/* ROLE SWITCH - REVERTED TO SIMPLE VERSION AS REQUESTED */}
        <div className="text-center mb-5">
          <div className="btn-group shadow-sm" role="group" aria-label="Role switch" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <Link
              href="/how-it-works?role=student"
              className={`btn btn-lg px-4 ${role === "student" ? "btn-primary" : "btn-outline-primary"}`}
              style={{ borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', transition: 'all 0.2s', pointerEvents: 'auto' }}
              onClick={(e) => { e.preventDefault(); handleRoleSwitch(e, "student"); }}
              shallow
            >
              I’m a Student
            </Link>
            <Link
              href="/how-it-works?role=teacher"
              className={`btn btn-lg px-4 ${role === "teacher" ? "btn-primary" : "btn-outline-primary"}`}
              style={{ borderTopRightRadius: '12px', borderBottomRightRadius: '12px', transition: 'all 0.2s', pointerEvents: 'auto' }}
              onClick={(e) => { e.preventDefault(); handleRoleSwitch(e, "teacher"); }}
              shallow
            >
              I’m a Teacher
            </Link>
          </div>
        </div>

        <header className="text-center mb-4">
          <h1 className="h3 fw-bold mb-2">{seoH1 || 'How It Works – BridgeLang'}</h1>
          <p className="text-muted mb-0">
            {role === "teacher"
              ? "Teach real-life English to learners in the UK — online or in person."
              : "Learn real-life English for your life in the UK — with verified tutors who understand British culture."}
          </p>
        </header>

        {role === "student" ? (
          <>
            <StudentOnboardingVideo videoId="P2y8ftutxX0" />
            <section className={styles.card} style={{marginTop:'2rem'}}>
              <h2 className={styles.h2}>How students learn</h2>
              <ul className={styles.list}>
                <li><strong>Step 1:</strong> Start with Free access and explore verified profiles.</li>
                <li><strong>Step 2:</strong> Find a tutor and book a 15-min intro for only £4.99.</li>
                <li><strong>Step 3:</strong> Join your live lesson directly in your browser.</li>
              </ul>
            </section>
          </>
        ) : (
          <>
            <TeacherOnboardingVideo videoId="opff15raLa4" />
            <section className={styles.card} style={{marginTop:'2rem'}}>
              <h2 className={styles.h2}>How teachers grow</h2>
              <ul className={styles.list}>
                <li><strong>Step 1:</strong> Create your profile and set your own rates.</li>
                <li><strong>Step 2:</strong> Connect payments securely via Stripe.</li>
                <li><strong>Step 3:</strong> Start teaching UK-focused learners online.</li>
              </ul>
            </section>
          </>
        )}

        <section className="mt-5">
           <h3 className={`${styles.h3} text-center mb-3`}>See the platform in action</h3>
           <div key={role} id="roleShots" className={`carousel slide ${styles.carouselWrap}`} data-bs-ride="carousel" data-bs-interval="8000">
                <div className={`carousel-inner rounded shadow-sm ${styles.carouselInner}`}>
                  {SHOTS.map((s, i) => (
                    <div className={`carousel-item ${i === 0 ? "active" : ""}`} key={`${role}-${i}`}>
                      <div className={styles.shotBox}>
                        <img src={s.src} className={styles.shotImg} alt={s.caption} />
                      </div>
                      <div className={styles.captionAlways}>
                        <div className={styles.captionHeader}>
                          <p className={styles.captionText}>{s.caption}</p>
                          <button className={styles.infoBtn} onClick={(e) => toggleInfo(i, e)}>
                            {activeInfo[i] ? '✕' : 'ⓘ'}
                          </button>
                        </div>
                        <div className={`${styles.infoCollapse} ${activeInfo[i] ? styles.show : ''}`}>
                             <p className={styles.captionDescription}>{s.description}</p>
                        </div>
                      </div>
                      <p className={styles.slideDisclaimer}>Images shown are illustrative and may not represent a real account. Actual dashboards may vary based on user role and settings.</p>
                    </div>
                  ))}
                </div>
                <button className="carousel-control-prev" type="button" data-bs-target="#roleShots" data-bs-slide="prev" style={{zIndex: 5}}>
                  <span className="carousel-control-prev-icon"></span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#roleShots" data-bs-slide="next" style={{zIndex: 5}}>
                  <span className="carousel-control-next-icon"></span>
                </button>
           </div>
        </section>
      </div>
    </>
  );
}
