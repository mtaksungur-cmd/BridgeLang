import { useState, useRef } from 'react';
import { auth, db } from '../../lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import ReCAPTCHA from 'react-google-recaptcha';
import styles from '../../scss/StudentRegister.module.scss';

export default function StudentRegister() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', city: '', timezone: 'Europe/London',
    phone: '', level: '', intro: '', profilePhoto: null,
    goals: [], otherGoal: '', acceptTerms: false,
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const recaptchaRef = useRef(null);

  const goalsList = [
    "Improve my speaking and fluency",
    "Prepare for IELTS or TOEFL",
    "Business English for work",
    "Academic English (writing, reading, etc.)",
    "English for Specific Purposes (ESP)",
    "Grammar",
    "Prepare for job interviews",
    "British citizenship or visa test preparation",
    "Pronunciation and accent training",
    "I am a complete beginner"
  ];

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox' && name === 'goals') {
      setForm((prev) => ({
        ...prev,
        goals: checked ? [...prev.goals, value] : prev.goals.filter((g) => g !== value)
      }));
    } else if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      setForm((prev) => ({ ...prev, profilePhoto: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const uploadFileViaApi = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    return data.url;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!form.acceptTerms) return setError('You must accept the Terms of Use and Privacy Policy.');
    if (form.goals.length === 0 && !form.otherGoal.trim()) return setError('Please select at least one goal.');

    try {
      const token = await recaptchaRef.current.executeAsync();
      recaptchaRef.current.reset();

      const verifyRes = await fetch('/api/verify-recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) return setError('reCAPTCHA verification failed.');

      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;
      await sendEmailVerification(user);

      let profilePhotoUrl = '';
      if (form.profilePhoto) {
        profilePhotoUrl = await uploadFileViaApi(form.profilePhoto);
      }

      await setDoc(doc(db, 'users', user.uid), {
        name: form.name,
        email: form.email,
        city: form.city,
        timezone: form.timezone,
        phone: form.phone,
        level: form.level,
        intro: form.intro,
        goals: [...form.goals, ...(form.otherGoal ? [form.otherGoal] : [])],
        profilePhotoUrl,
        emailVerified: false,
        role: 'student',
        createdAt: Date.now(),
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Student Registration</h2>
      <form onSubmit={handleRegister} className={styles.form}>
        <input className={styles.input} name="name" placeholder="Full Name" onChange={handleChange} required />
        <input className={styles.input} name="email" type="email" placeholder="Email Address" onChange={handleChange} required />
        <input className={styles.input} name="password" type="password" placeholder="Password" onChange={handleChange} required />
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

        <label>Profile Photo (optional):</label>
        <input className={styles.fileInput} type="file" name="profilePhoto" accept="image/*" onChange={handleChange} />

        <p><strong>Your English Learning Goals:</strong> (select at least one)</p>
        <div className={styles.checkboxGroup}>
          {goalsList.map((goal, i) => (
            <label key={i} className={styles.checkboxLabel}>
              <input type="checkbox" name="goals" value={goal} onChange={handleChange} /> {goal}
            </label>
          ))}
        </div>

        <label>Other Goal:
          <input className={styles.input} type="text" name="otherGoal" onChange={handleChange} />
        </label>

        <label>
          <input type="checkbox" name="acceptTerms" checked={form.acceptTerms} onChange={handleChange} />
          I agree to the Terms of Use and Privacy Policy
        </label>

        <ReCAPTCHA sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY} size="invisible" ref={recaptchaRef} />

        <button type="submit" className={styles.button}>Register</button>
      </form>

      {error && <p className={styles.error}>❌ {error}</p>}
      {success && <p className={styles.success}>✅ Registration successful! Please verify your email.</p>}
    </div>
  );
}
