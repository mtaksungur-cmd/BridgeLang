'use client';
import { useState, useRef } from 'react';
import { auth, db } from '../../lib/firebase';
import Link from 'next/link';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import ReCAPTCHA from 'react-google-recaptcha';
import styles from '../../scss/StudentRegister.module.scss';

export default function StudentRegister() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    dob: '',
    parentName: '',
    parentEmail: '',
    city: '',
    country: 'England',
    phone: '',
    level: '',
    intro: '',
    learning_goal_category: '',
    learning_goal: '',
    cambridge_exam: '',
    otherGoal: '',
    acceptTerms: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const recaptchaRef = useRef(null);

  /* 🔹 Kategori & alt seçenekler */
  const goalOptions = {
    exam: {
      label: '🎓 Exam & Academic Goals',
      options: [
        'IELTS (Academic / General)',
        'TOEFL (iBT)',
        'PTE (Pearson Test of English)',
        'Cambridge Exams',
        'OET (Occupational English Test)',
        'SAT / ACT English',
        'EAP (English for Academic Purposes)',
        'Essay Writing / Research Skills',
        'Academic Presentations',
      ],
      cambridgeLevels: ['KET', 'PET', 'FCE', 'CAE', 'CPE'],
    },
    professional: {
      label: '💼 Professional & Career Goals',
      options: [
        'Business English',
        'Workplace Communication & Writing',
        'Interview Preparation',
        'Presentation Skills',
        'English for Healthcare / Nursing (NHS)',
        'English for IT / Engineering / Technology',
        'English for Hospitality / Tourism',
        'English for Retail / Customer Service',
        'CV & Cover Letter Writing',
      ],
    },
    general: {
      label: '💬 General & Social Goals',
      options: [
        'Everyday English',
        'Conversational Fluency',
        'Grammar & Writing Skills',
        'Pronunciation & Accent Reduction',
        'Listening & Speaking Confidence',
        'English for Travel',
        'Cultural English (films, music, media)',
        'Modern English Expressions and Fluency',
      ],
    },
    personal: {
      label: '🌍 Personal & Integration Goals',
      options: [
        'English for Immigration / Citizenship',
        'English for Life in the UK',
        'Parent Support English',
        'Social English',
        'Integration & Cultural Understanding',
        'English for Hobbies',
        'Other',
      ],
    },
    teen: {
      label: '🧒 Teen Learners / Young Learners (Ages 14–17)',
      options: [
        'School Projects & Presentations',
        'Speaking Confidence for Teenagers',
        'English for Exams (GCSE / A-Level)',
        'Creative English (Storytelling, Drama, Games)',
        'Homework & Academic Support',
      ],
    },
    digital: {
      label: '🌐 Digital & Modern English Goals',
      options: [
        'English for Social Media / Influencers',
        'English for Content Creators',
        'English for Remote Work & Freelancing',
        'English for Online Meetings & Presentations',
        'English for AI Tools & Digital Literacy',
        'Email Etiquette & Online Communication',
        'Networking & Collaboration in English',
      ],
    },
  };

  const calcAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
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

    const age = calcAge(form.dob);
    if (age < 14) return setError('You must be at least 14 years old to use BridgeLang.');
    if (!form.acceptTerms) return setError('You must accept the Terms of Use and Privacy Policy.');
    if (!form.learning_goal_category) return setError('Please select a goal category.');
    if (!form.learning_goal) return setError('Please select a learning goal.');

    if (form.learning_goal === 'Other' && !form.otherGoal.trim())
      return setError('Please specify your goal (max 250 characters).');

    setSubmitting(true);
    try {
      const token = await recaptchaRef.current.executeAsync();
      recaptchaRef.current.reset();
      const verifyRes = await fetch('/api/verify-recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) throw new Error('reCAPTCHA verification failed.');

      const email = form.email.trim().toLowerCase();
      const { user } = await createUserWithEmailAndPassword(auth, email, form.password);

      let profilePhotoUrl = '';
      if (form.profilePhoto) profilePhotoUrl = await uploadFileViaApi(form.profilePhoto);

      const selectedGoal =
        form.learning_goal === 'Cambridge Exams' && form.cambridge_exam
          ? `Cambridge ${form.cambridge_exam}`
          : form.learning_goal === 'Other'
          ? form.otherGoal.trim()
          : form.learning_goal;

      await setDoc(doc(db, 'users', user.uid), {
        name: form.name.trim(),
        email,
        dob: form.dob,
        city: form.city.trim(),
        country: form.country,
        phone: form.phone.trim() || '',
        level: form.level || '',
        intro: form.intro.trim() || '',
        learning_goal_category: form.learning_goal_category,
        learning_goal: selectedGoal,
        profilePhotoUrl,
        role: 'student',
        emailVerified: !!user.emailVerified,
        createdAt: Date.now(),
        parentConsentRequired: age < 18,
        parentConsent: null,
        subscriptionPlan: 'free',
        viewLimit: 10,
        messagesLeft: 3,
        subscription: {
          planKey: 'free',
          activeUntil: null,
          activeUntilMillis: null,
          lifetimePayments: 0,
        },
      });

      if (age < 18) {
        if (!form.parentEmail || !form.parentName)
          throw new Error('Parent information is required for students under 18.');
        await fetch('/api/parent-consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: user.uid,
            studentName: form.name,
            parentName: form.parentName,
            parentEmail: form.parentEmail,
            dob: form.dob,
          }),
        });
        setSuccess(true);
      } else {
        await fetch('/api/auth/send-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: form.name }),
        });
        setSuccess(true);
      }

      await signOut(auth);
    } catch (err) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const age = calcAge(form.dob);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Student Registration</h2>

      <form onSubmit={handleRegister} className={styles.form}>
        <input className={styles.input} name="name" placeholder="Full Name" onChange={handleChange} required />
        <input className={styles.input} name="email" type="email" placeholder="Email Address" onChange={handleChange} required />
        <input className={styles.input} name="password" type="password" placeholder="Password (min 6 chars)" onChange={handleChange} required />

        <label>Date of Birth</label>
        <input className={styles.input} name="dob" type="date" onChange={handleChange} required />

        {age !== null && age < 18 && age >= 14 && (
          <>
            <label>Parent/Guardian Name</label>
            <input className={styles.input} name="parentName" onChange={handleChange} required />
            <label>Parent/Guardian Email</label>
            <input className={styles.input} type="email" name="parentEmail" onChange={handleChange} required />
          </>
        )}

        <input className={styles.input} name="city" placeholder="City" onChange={handleChange} required />
        <select name="country" className={styles.input} onChange={handleChange} value={form.country}>
          <option>England</option>
          <option>Scotland</option>
          <option>Wales</option>
          <option>Northern Ireland</option>
        </select>

        <input className={styles.input} name="phone" placeholder="Phone (optional)" onChange={handleChange} />

        <select name="level" className={styles.input} onChange={handleChange}>
          <option value="">Select your level (optional)</option>
          <option>Beginner</option>
          <option>Elementary</option>
          <option>Intermediate</option>
          <option>Upper-Intermediate</option>
          <option>Advanced</option>
        </select>

        <textarea
          className={styles.textarea}
          name="intro"
          placeholder="Tell us a bit about yourself (optional)"
          onChange={handleChange}
        />

        {/* 🔹 Yeni Learning Goals Alanı */}
        <p className={styles.sectionTitle}>🎯 Your English Learning Goals</p>

        <select
          name="learning_goal_category"
          className={styles.input}
          value={form.learning_goal_category}
          onChange={(e) => setForm((p) => ({ ...p, learning_goal_category: e.target.value, learning_goal: '' }))}
          required
        >
          <option value="">Select a Goal Category</option>
          {Object.entries(goalOptions).map(([key, val]) => {
            if (key === 'teen' && (age === null || age > 17)) return null;
            return (
              <option key={key} value={key}>
                {val.label}
              </option>
            );
          })}
        </select>

        {form.learning_goal_category && (
          <>
            <select
              name="learning_goal"
              className={styles.input}
              value={form.learning_goal}
              onChange={handleChange}
              required
            >
              <option value="">Select a Specific Goal</option>
              {goalOptions[form.learning_goal_category].options.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>

            {form.learning_goal === 'Cambridge Exams' && (
              <select
                name="cambridge_exam"
                className={styles.input}
                value={form.cambridge_exam}
                onChange={handleChange}
                required
              >
                <option value="">Select Cambridge Exam</option>
                {goalOptions.exam.cambridgeLevels.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {form.learning_goal === 'Other' && (
              <textarea
                name="otherGoal"
                className={styles.textarea}
                placeholder="Please specify your goal (max 250 characters)"
                maxLength={250}
                value={form.otherGoal}
                onChange={handleChange}
                required
              />
            )}
          </>
        )}

        <label className={styles.checkItem}>
          <input
            type="checkbox"
            name="acceptTerms"
            checked={form.acceptTerms}
            onChange={(e) => setForm((p) => ({ ...p, acceptTerms: e.target.checked }))}
          />
          <span>
            I agree to the{' '}
            <Link href="/legal/terms" target="_blank" className={styles.inlineLink}>
              Terms of Use
            </Link>{' '}
            and{' '}
            <Link href="/legal/privacy" target="_blank" className={styles.inlineLink}>
              Privacy Policy
            </Link>
          </span>
        </label>

        <ReCAPTCHA sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY} size="invisible" ref={recaptchaRef} />

        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {submitting ? 'Creating your account…' : 'Register'}
        </button>
      </form>

      {error && <p className={styles.error}>❌ {error}</p>}
      {success && (
        <div className={styles.successBox}>
          <p className={styles.successText}>✅ Registration successful!</p>
          <p className={styles.successHint}>
            {age < 18
              ? `We’ve emailed a parental consent request to ${form.parentEmail}.`
              : `We’ve sent a verification email to ${form.email}. Please check Inbox/Spam.`}
          </p>
        </div>
      )}
    </div>
  );
}
