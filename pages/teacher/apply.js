'use client';
import { useState } from 'react';
import { auth, db } from '../../lib/firebase';
import Link from 'next/link';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

const SPECIALTIES = [
  'English (General)', 'Business English', 'IELTS Preparation', 'TOEFL Preparation',
  'Cambridge Exams', 'Academic Writing', 'Conversational English', 'Kids & Young Learners',
  'Exam Preparation (Other)', 'Professional Communication',
];

export default function TeacherApply() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '', country: '', city: '',
    specialty: [], experienceYears: '', certifications: [],
    pricing30: '', pricing60: '', deliveryMethod: 'Online Only', willingToTravel: false,
    bio: '', videoIntroUrl: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const toggleArrayItem = (field, item) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item) ? prev[field].filter(i => i !== item) : [...prev[field], item]
    }));
  };

  const validateStep = () => {
    setError('');
    if (step === 1 && (!form.name || !form.email || !form.password || !form.country)) {
      setError('Please fill in all required fields');
      return false;
    }
    if (step === 1 && form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (step === 2 && (form.specialty.length === 0 || !form.experienceYears)) {
      setError('Please complete all required fields in this step');
      return false;
    }
    if (step === 3 && (!form.pricing30 || !form.pricing60)) {
      setError('Please set your lesson prices');
      return false;
    }
    return true;
  };

  const nextStep = () => { if (validateStep()) { setStep(step + 1); window.scrollTo(0, 0); } };
  const prevStep = () => { setStep(step - 1); setError(''); window.scrollTo(0, 0); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setSubmitting(true);
    setError('');

    try {
      const email = form.email.trim().toLowerCase();
      const { user } = await createUserWithEmailAndPassword(auth, email, form.password);

      // FIX: Save to 'users' collection for login to work
      await setDoc(doc(db, 'users', user.uid), {
        name: form.name.trim(), email, country: form.country, city: form.city || '',
        role: 'teacher', approved: false, status: 'pending', emailVerified: false,
        specialties: form.specialty, teachingSpecializations: form.specialty.join(', '),
        experienceYears: form.experienceYears, certifications: form.certifications,
        pricing30: Number(form.pricing30), pricing60: Number(form.pricing60),
        deliveryMethod: form.deliveryMethod, willingToTravel: form.willingToTravel,
        bio: form.bio || '', videoIntroUrl: form.videoIntroUrl || '',
        createdAt: new Date(),
      });

      await fetch('/api/mail/admin-new-teacher', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email, specialty: form.specialty.join(', ') }),
      }).catch(() => { });

      await signOut(auth);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError('This email is already registered');
      else if (err.code === 'auth/invalid-email') setError('Invalid email address');
      else if (err.code === 'auth/weak-password') setError('Password is too weak');
      else setError('Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSteps = 4;
  const progress = Math.round((step / totalSteps) * 100);

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: '480px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '3rem 2.5rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Check style={{ width: '32px', height: '32px', color: 'white' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.75rem' }}>Application Submitted!</h2>
          <p style={{ fontSize: '0.9375rem', color: '#64748b', marginBottom: '2rem', lineHeight: '1.6' }}>
            Thank you for applying! Our team will review your application and get back to you within 1-2 business days.
          </p>
          <Link href="/login">
            <button style={{ padding: '0.75rem 2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.9375rem', fontWeight: '600', cursor: 'pointer', width: '100%' }}>
              Return to Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem' }}>
      <Link href="/">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', cursor: 'pointer' }}>
          <div style={{ width: '32px', height: '32px', background: '#3b82f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.25rem', fontWeight: '700' }}>B</div>
          <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1a1a1a' }}>BridgeLang</span>
        </div>
      </Link>

      <div style={{ width: '100%', maxWidth: '520px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '2.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '500' }}>Step {step} of {totalSteps}</span>
            <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '500' }}>{progress}% Complete</span>
          </div>
          <div style={{ height: '8px', background: '#e9ecef', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#667eea', width: `${progress}%`, transition: 'width 0.3s ease', borderRadius: '8px' }} />
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.5rem' }}>
            {step === 1 && 'Create Your Account'}
            {step === 2 && 'Teaching Details'}
            {step === 3 && 'Pricing & Availability'}
            {step === 4 && 'About You'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {step === 1 && 'Enter your basic information'}
            {step === 2 && 'Tell us about your teaching experience'}
            {step === 3 && 'Set your rates and how you teach'}
            {step === 4 && 'Introduce yourself to students'}
          </p>
        </div>

        {error && <div style={{ padding: '0.875rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{error}</div>}

        <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>Full Name *</label><input type="text" name="name" value={form.name} onChange={handleChange} placeholder="John Smith" required style={{ width: '100%', padding: '0.75rem 0.875rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9375rem' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>Email Address *</label><input type="email" name="email" value={form.email} onChange={handleChange} placeholder="john@example.com" required style={{ width: '100%', padding: '0.75rem 0.875rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9375rem' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>Password *</label><div style={{ position: 'relative' }}><input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" required minLength={6} style={{ width: '100%', padding: '0.75rem 0.875rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9375rem' }} /><button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: '#64748b' }}>{showPassword ? 'Hide' : 'Show'}</button></div></div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>Country *</label>
                <select name="country" value={form.country} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem 0.875rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9375rem', cursor: 'pointer' }}>
                  <option value="">Select your country</option>
                  <option value="England">England</option>
                  <option value="Scotland">Scotland</option>
                  <option value="Wales">Wales</option>
                  <option value="Northern Ireland">Northern Ireland</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>City</label>
                <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="London" style={{ width: '100%', padding: '0.75rem 0.875rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9375rem' }} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.75rem' }}>What do you teach? *</label><div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>{SPECIALTIES.map(spec => (<label key={spec} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px' }}><input type="checkbox" checked={form.specialty.includes(spec)} onChange={() => toggleArrayItem('specialty', spec)} style={{ width: '16px', height: '16px' }} /><span style={{ fontSize: '0.875rem', color: '#475569' }}>{spec}</span></label>))}</div></div>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>Years of Experience *</label><select name="experienceYears" value={form.experienceYears} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem 0.875rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9375rem', cursor: 'pointer' }}><option value="">Select experience</option><option value="1">1 year</option><option value="2">2 years</option><option value="3-5">3-5 years</option><option value="5-10">5-10 years</option><option value="10+">10+ years</option></select></div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>30-Minute Lesson Price (£) *</label><input type="number" name="pricing30" value={form.pricing30} onChange={handleChange} placeholder="15" min="5" required style={{ width: '100%', padding: '0.75rem 0.875rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9375rem' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>60-Minute Lesson Price (£) *</label><input type="number" name="pricing60" value={form.pricing60} onChange={handleChange} placeholder="25" min="10" required style={{ width: '100%', padding: '0.75rem 0.875rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9375rem' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>Delivery Method *</label><select name="deliveryMethod" value={form.deliveryMethod} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem 0.875rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9375rem', cursor: 'pointer' }}><option value="Online Only">Online Only</option><option value="In-Person Only">In-Person Only</option><option value="Both">Both Online & In-Person</option></select></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}><input type="checkbox" name="willingToTravel" checked={form.willingToTravel} onChange={handleChange} style={{ width: '18px', height: '18px' }} /><span style={{ fontSize: '0.875rem', color: '#475569' }}>I'm willing to travel to students</span></label>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>About You</label><textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Tell students about your teaching style, experience, and what makes you a great teacher..." rows="5" style={{ width: '100%', padding: '0.75rem 0.875rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9375rem', fontFamily: 'inherit', resize: 'vertical' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>Video Introduction URL (Optional)</label><input type="url" name="videoIntroUrl" value={form.videoIntroUrl} onChange={handleChange} placeholder="https://youtube.com/..." style={{ width: '100%', padding: '0.75rem 0.875rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9375rem' }} /><p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.375rem' }}>A short video intro helps you stand out</p></div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
            {step > 1 && <button type="button" onClick={prevStep} style={{ flex: 1, padding: '0.875rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9375rem', fontWeight: '600', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><ChevronLeft style={{ width: '18px', height: '18px' }} />Back</button>}
            <button type="submit" disabled={submitting} style={{ flex: 1, padding: '0.875rem', background: submitting ? '#94a3b8' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.9375rem', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>{submitting ? 'Submitting...' : step === 4 ? 'Submit Application' : 'Next'}{!submitting && step < 4 && <ChevronRight style={{ width: '18px', height: '18px' }} />}</button>
          </div>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
          Already have an account? <Link href="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
