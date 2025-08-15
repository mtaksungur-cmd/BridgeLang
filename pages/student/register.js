import { useState, useRef } from 'react';
import { auth, db } from '../../lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import ReCAPTCHA from 'react-google-recaptcha';
import styles from '../../scss/StudentRegister.module.scss';

export default function StudentRegister() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    city: '',
    timezone: 'Europe/London',
    phone: '',
    level: '',
    intro: '',
    profilePhoto: null,
    goals: [],
    otherGoal: '',
    acceptTerms: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');
  const recaptchaRef = useRef(null);

  const goalsList = [
    'Improve my speaking and fluency',
    'Prepare for IELTS or TOEFL',
    'Business English for work',
    'Academic English (writing, reading, etc.)',
    'English for Specific Purposes (ESP)',
    'Grammar',
    'Prepare for job interviews',
    'British citizenship or visa test preparation',
    'Pronunciation and accent training',
    'I am a complete beginner',
  ];

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox' && name === 'goals') {
      setForm((p) => ({
        ...p,
        goals: checked ? [...p.goals, value] : p.goals.filter((g) => g !== value),
      }));
    } else if (type === 'checkbox') {
      setForm((p) => ({ ...p, [name]: checked }));
    } else if (type === 'file') {
      setForm((p) => ({ ...p, profilePhoto: files?.[0] || null }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const uploadFileViaApi = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok || !data?.url) throw new Error('Image upload failed');
    return data.url;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!form.acceptTerms) return setError('You must accept the Terms of Use and Privacy Policy.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.goals.length === 0 && !form.otherGoal.trim()) return setError('Please select at least one goal.');

    setSubmitting(true);
    try {
      // reCAPTCHA
      const token = await recaptchaRef.current.executeAsync();
      recaptchaRef.current.reset();
      const verifyRes = await fetch('/api/verify-recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) throw new Error('reCAPTCHA verification failed.');

      // Auth
      const email = form.email.trim().toLowerCase();
      const { user } = await createUserWithEmailAndPassword(auth, email, form.password);
      await sendEmailVerification(user);

      // Fotoğraf (opsiyonel)
      let profilePhotoUrl = '';
      if (form.profilePhoto) profilePhotoUrl = await uploadFileViaApi(form.profilePhoto);

      // Firestore – tüm gerekli alanlar
      await setDoc(doc(db, 'users', user.uid), {
        name: form.name.trim(),
        email,
        city: form.city.trim(),
        timezone: form.timezone || 'Europe/London',
        phone: form.phone.trim() || '',
        level: form.level || '',
        intro: form.intro.trim() || '',
        goals: [...form.goals, ...(form.otherGoal ? [form.otherGoal.trim()] : [])],
        profilePhotoUrl,

        role: 'student',
        emailVerified: !!user.emailVerified,
        createdAt: Date.now(),

        subscriptionPlan: null,
        subscriptionStartedAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,

        credits: 0,
        viewLimit: 0,
        messagesLeft: 0,

        loyaltyMonths: 0,
        loyaltyBonusCount: 0,
        reviewBonusUsed: false,

        discountEligible: false,
        discountGivenCount: 0,
        discountUsedCount: 0,
        lastDiscountUsedAt: null,
      });

      setSuccess(true);
    } catch (err) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Student Registration</h2>

      <div className={styles.infoBanner}>
        After you register, we’ll email you a verification link. <strong>Please check your Inbox and Spam/Junk folders.</strong> You must verify your email before logging in.
      </div>

      <form onSubmit={handleRegister} className={styles.form}>
        <input className={styles.input} name="name" placeholder="Full Name" onChange={handleChange} required />
        <input className={styles.input} name="email" type="email" placeholder="Email Address" onChange={handleChange} required />
        <input className={styles.input} name="password" type="password" placeholder="Password (min 6 chars)" onChange={handleChange} required />
        <input className={styles.input} name="city" placeholder="City or Postcode" onChange={handleChange} required />
        <input className={styles.input} name="timezone" placeholder="Timezone" value={form.timezone} onChange={handleChange} />
        <input className={styles.input} name="phone" placeholder="Phone (optional)" onChange={handleChange} />

        <select name="level" className={styles.select} onChange={handleChange}>
          <option value="">Select your level (optional)</option>
          <option>Beginner</option>
          <option>Elementary</option>
          <option>Intermediate</option>
          <option>Upper-Intermediate</option>
          <option>Advanced</option>
        </select>

        <textarea className={styles.textarea} name="intro" placeholder="Tell us a bit about yourself (optional)" onChange={handleChange} />

        <label className="mt-2">Profile Photo (optional):</label>
        <input className={styles.fileInput} type="file" name="profilePhoto" accept="image/*" onChange={handleChange} />

        <p className="mt-3"><strong>Your English Learning Goals</strong> (select at least one)</p>
        <div className={styles.checkboxGroup}>
          {goalsList.map((goal) => (
            <label key={goal} className={styles.checkboxLabel}>
              <input type="checkbox" name="goals" value={goal} onChange={handleChange} /> {goal}
            </label>
          ))}
        </div>

        <label className="mt-2">
          Other Goal:
          <input className={styles.input} type="text" name="otherGoal" onChange={handleChange} />
        </label>

        <label className="mt-2 d-flex align-items-center gap-2">
          <input type="checkbox" name="acceptTerms" checked={form.acceptTerms} onChange={handleChange} />
          <span>I agree to the Terms of Use and Privacy Policy</span>
        </label>

        <ReCAPTCHA sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY} size="invisible" ref={recaptchaRef} />

        <button type="submit" className={styles.button} disabled={submitting}>
          {submitting ? 'Creating your account…' : 'Register'}
        </button>
      </form>

      {error && <p className={styles.error}>❌ {error}</p>}
      {success && (
        <p className={styles.success}>
          ✅ Registration successful! We’ve sent a verification email to <strong>{form.email}</strong>.
          <br />Please verify your email to log in. Don’t forget to check your Spam/Junk.
        </p>
      )}
    </div>
  );
}
