import { useState, useRef } from 'react';
import { auth, db } from '../../lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import ReCAPTCHA from 'react-google-recaptcha';

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
      if (checked) {
        setForm((prev) => ({ ...prev, goals: [...prev.goals, value] }));
      } else {
        setForm((prev) => ({ ...prev, goals: prev.goals.filter((g) => g !== value) }));
      }
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
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
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
    <div style={{ maxWidth: 600, margin: 'auto', paddingTop: 50 }}>
      <h2>Student Registration</h2>
      <form onSubmit={handleRegister}>
        <input name="name" placeholder="Full Name" onChange={handleChange} required /><br />
        <input name="email" type="email" placeholder="Email Address" onChange={handleChange} required /><br />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required /><br />
        <input name="city" placeholder="City or Postcode" onChange={handleChange} required /><br />
        <input name="timezone" placeholder="Timezone" value={form.timezone} onChange={handleChange} /><br />
        <input name="phone" placeholder="Phone (optional)" onChange={handleChange} /><br />

        <select name="level" onChange={handleChange}>
          <option value="">Select your level (optional)</option>
          <option>Beginner</option>
          <option>Elementary</option>
          <option>Intermediate</option>
          <option>Upper-Intermediate</option>
          <option>Advanced</option>
        </select><br /><br />

        <textarea name="intro" placeholder="Tell us a bit about yourself (optional)" onChange={handleChange} /><br />

        <label>Profile Photo (optional):</label><br />
        <input type="file" name="profilePhoto" accept="image/*" onChange={handleChange} /><br /><br />

        <p><strong>Your English Learning Goals:</strong> (select at least one)</p>
        {goalsList.map((goal, i) => (
          <label key={i}><input type="checkbox" name="goals" value={goal} onChange={handleChange} /> {goal}</label>
        ))}<br />
        <label>Other Goal: <input type="text" name="otherGoal" onChange={handleChange} /></label><br /><br />

        <label>
          <input type="checkbox" name="acceptTerms" checked={form.acceptTerms} onChange={handleChange} />
          I agree to the Terms of Use and Privacy Policy
        </label><br /><br />

        <ReCAPTCHA
          sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
          size="invisible"
          ref={recaptchaRef}
        />

        <button type="submit">Register</button>
      </form>

      {error && <p style={{ color: 'red' }}>❌ {error}</p>}
      {success && <p style={{ color: 'green' }}>✅ Registration successful! Please verify your email.</p>}
    </div>
  );
}
