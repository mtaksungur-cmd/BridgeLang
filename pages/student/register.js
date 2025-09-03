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
    dob: '',
    parentName: '',
    parentEmail: '',
    city: '',
    country: 'England',
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
  const [error, setError] = useState('');
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

  const calcAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
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
    if (!form.dob) return setError('Please enter your date of birth.');

    const age = calcAge(form.dob);
    if (age < 14) return setError('You must be at least 14 years old to use BridgeLang.');

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

      const email = form.email.trim().toLowerCase();

      // Auth
      const { user } = await createUserWithEmailAndPassword(auth, email, form.password);

      // Fotoğraf (opsiyonel)
      let profilePhotoUrl = '';
      if (form.profilePhoto) profilePhotoUrl = await uploadFileViaApi(form.profilePhoto);

      // Firestore – tüm gerekli alanlar
      await setDoc(doc(db, 'users', user.uid), {
        name: form.name.trim(),
        email,
        dob: form.dob,
        city: form.city.trim(),
        country: form.country,
        phone: form.phone.trim() || '',
        level: form.level || '',
        intro: form.intro.trim() || '',
        goals: [...form.goals, ...(form.otherGoal ? [form.otherGoal.trim()] : [])],
        profilePhotoUrl,
        role: 'student',
        emailVerified: !!user.emailVerified,
        createdAt: Date.now(),
        parentConsentRequired: age < 18,
        parentConsent: null,
      });

      // Eğer 14–17 yaş arası ise → parent-consent API
      if (age < 18) {
        if (!form.parentEmail || !form.parentName) {
          throw new Error('Parent information is required for students under 18.');
        }
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
        setError('');
      } else {
        // Normal kullanıcı → verification mail
        await sendEmailVerification(user);
        setSuccess(true);
      }
    } catch (err) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Student Registration</h2>

      <form onSubmit={handleRegister} className={styles.form}>
        <input className={styles.input} name="name" placeholder="Full Name" onChange={handleChange} required />
        <input className={styles.input} name="email" type="email" placeholder="Email Address" onChange={handleChange} required />
        <input className={styles.input} name="password" type="password" placeholder="Password (min 6 chars)" onChange={handleChange} required />
        
        <label>Date of Birth</label>
        <input className={styles.input} name="dob" type="date" onChange={handleChange} required />

        {(() => {
          const age = calcAge(form.dob);
          if (age !== null && age < 18 && age >= 14) {
            return (
              <>
                <label>Parent/Guardian Name</label>
                <input className={styles.input} name="parentName" onChange={handleChange} required />
                <label>Parent/Guardian Email</label>
                <input className={styles.input} type="email" name="parentEmail" onChange={handleChange} required />
              </>
            );
          }
          return null;
        })()}

        <input className={styles.input} name="city" placeholder="City" onChange={handleChange} required />
        
        <select name="country" className={styles.select} onChange={handleChange} value={form.country}>
          <option>England</option>
          <option>Scotland</option>
          <option>Wales</option>
          <option>Northern Ireland</option>
        </select>

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

        <label>Profile Photo (optional)</label>
        <input className={styles.fileInput} type="file" name="profilePhoto" accept="image/*" onChange={handleChange} />

        <p><strong>Your English Learning Goals</strong> (select at least one)</p>
        <div className={styles.checkboxGroup}>
          {goalsList.map((goal) => (
            <label key={goal} className={styles.checkboxLabel}>
              <input type="checkbox" name="goals" value={goal} onChange={handleChange} /> {goal}
            </label>
          ))}
        </div>

        <label>Other Goal:</label>
        <input className={styles.input} type="text" name="otherGoal" onChange={handleChange} />

        <label className="mt-2 d-flex align-items-center gap-2">
          <input
            type="checkbox"
            name="acceptTerms"
            checked={form.acceptTerms}
            onChange={handleChange}
          />
          <span>
            I agree to the{" "}
            <a href="/legal/terms" target="_blank" rel="noopener noreferrer">
              Terms of Use
            </a>{" "}
            and{" "}
            <a href="/legal/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
          </span>
        </label>

        <ReCAPTCHA sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY} size="invisible" ref={recaptchaRef} />

        <button type="submit" className={styles.button} disabled={submitting}>
          {submitting ? 'Creating your account…' : 'Register'}
        </button>
      </form>

      {error && <p className={styles.error}>❌ {error}</p>}
      {success && (
        <p className={styles.success}>
          ✅ Registration successful! <br/>
          {calcAge(form.dob) < 18 
            ? `We’ve emailed a parental consent request to ${form.parentEmail}.`
            : `We’ve sent a verification email to ${form.email}. Please check Inbox/Spam.`}
        </p>
      )}
    </div>
  );
}
