import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import styles from "../scss/Contact.module.scss";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    consent: false,
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  const subjects = [
    "Technical Support",
    "Account / Login Issues",
    "Refund / Payment Question",
    "Teacher Application",
    "General Inquiry",
    "Feedback / Complaint",
  ];

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Please enter your full name.";
    if (!form.email.trim()) return "Please enter your email address.";
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email);
    if (!emailOk) return "Please enter a valid email address.";
    if (!form.message.trim() || form.message.trim().length < 20)
      return "Your message should be at least 20 characters.";
    if (!form.consent)
      return "You must agree to the Privacy Policy to submit the form.";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", msg: "" });

    const err = validate();
    if (err) {
      setStatus({ type: "error", msg: err });
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("subject", form.subject);
      fd.append("message", form.message);
      if (file) fd.append("attachment", file);

      const res = await fetch("/api/contact", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send");

      setStatus({
        type: "ok",
        msg: "Thank you! Your message has been sent. We will respond within 1–2 business days.",
      });
      setForm({ name: "", email: "", subject: "", message: "", consent: false });
      setFile(null);
    } catch {
      setStatus({ type: "error", msg: "Please check the required fields and try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contact BridgeLang UK Ltd.</title>
        <meta
          name="description"
          content="Contact BridgeLang – call us or message us on WhatsApp for quick support. Business hours: Monday – Friday, 9 AM – 6 PM (UK Time)."
        />
      </Head>

      <main className={`container py-4 ${styles.page}`} style={{ "--nav-height": "64px" }}>
        <header className={styles.header}>
          <h1>Contact BridgeLang UK Ltd.</h1>
          <p className="text-muted mb-0">
            You can reach us by phone or WhatsApp — we usually reply within 1–2 business days.
          </p>
        </header>

        <div className={styles.grid}>
          {/* CONTACT FORM */}
          <form className={styles.form} onSubmit={onSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="name" className={styles.label}>
                Full Name <span className={styles.req}>*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={styles.input}
                value={form.name}
                onChange={onChange}
                placeholder="Jane Doe"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>
                Email Address <span className={styles.req}>*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={styles.input}
                value={form.email}
                onChange={onChange}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="subject" className={styles.label}>Subject (optional)</label>
              <select
                id="subject"
                name="subject"
                className={styles.select}
                value={form.subject}
                onChange={onChange}
              >
                <option value="">— Select —</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="message" className={styles.label}>
                Message <span className={styles.req}>*</span>
              </label>
              <textarea
                id="message"
                name="message"
                className={styles.textarea}
                rows={6}
                minLength={20}
                value={form.message}
                onChange={onChange}
                placeholder="Please describe your request (min 20 characters)…"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="attachment" className={styles.label}>Attachment (optional)</label>
              <input
                id="attachment"
                name="attachment"
                type="file"
                className={styles.file}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.txt"
              />
              <small className="text-muted">Max ~10MB; screenshots or documents.</small>
            </div>

            <div className={`${styles.field} ${styles.consent}`}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="consent"
                  checked={form.consent}
                  onChange={onChange}
                  aria-required="true"
                />
                <span>
                  I agree that my data will be processed in accordance with the{" "}
                  <Link href="/legal/privacy">Privacy Policy</Link>.
                </span>
              </label>
            </div>

            {status.msg && (
              <div className={`${styles.status} ${status.type === "ok" ? styles.ok : styles.err}`}>
                {status.msg}
              </div>
            )}

            <div className={styles.actions}>
              <button type="submit" className={styles.submit} disabled={submitting}>
                {submitting ? "Sending…" : "Submit Request"}
              </button>
            </div>
          </form>

          {/* COMPANY CONTACT CARD */}
          <aside className={styles.company} aria-label="Company details">
            <h2 className={styles.company__title}>Contact BridgeLang UK Ltd.</h2>
            <p><strong>Phone / WhatsApp:</strong> +44 20 7111 1638</p>
            <p>You can call us or message us directly on WhatsApp for quick support.</p>
            <p>Business hours: Monday – Friday, 9 AM – 6 PM (UK Time)</p>

            <a
              href="https://wa.me/442071111638"
              className={styles.waContactBtn}
              target="_blank"
              rel="noopener"
              title="Need help? Chat with us on WhatsApp."
            >
              💬 Chat on WhatsApp
            </a>

            <div className={styles.company__help}>
              Need quick help? Check{" "}
              <Link href="/faq">FAQ</Link> or{" "}
              <Link href="/how-it-works">How it Works</Link>.
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
