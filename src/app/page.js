import Image from "next/image";
import styles from "./Home.module.scss"; // SCSS dosyan burada olacak

export default function Home() {
  return (
    <div className="container py-5">
      {/* Hero */}
      <div className="row align-items-center">
        <div className="col-lg-6">
          <h1 className="display-4 fw-bold">
            Learn English faster with verified tutors
          </h1>
          <p className="lead">
            Book lessons online or in person. Secure payments, automatic scheduling.
          </p>
          <div className="mt-4">
            <a href="/student/register" className="btn btn-primary me-2">
              Get Started
            </a>
            <a href="/how-it-works" className="btn btn-outline-secondary">
              How it works
            </a>
          </div>
        </div>
        <div className="col-lg-6 text-center">
          <img
            src="/hero-image.png"
            alt="Learning"
            className="img-fluid rounded"
          />
        </div>
      </div>

      {/* Features */}
      <div className="row mt-5">
        <div className="col-md-4">
          <h5>🎯 Verified Tutors</h5>
          <p>Every teacher is screened and onboarded with full profile setup.</p>
        </div>
        <div className="col-md-4">
          <h5>💬 Safe Messaging</h5>
          <p>All communication is filtered and monitored for safety.</p>
        </div>
        <div className="col-md-4">
          <h5>💳 Secure Payments</h5>
          <p>Stripe-powered payments released only after both sides confirm.</p>
        </div>
      </div>
    </div>
  );
}
