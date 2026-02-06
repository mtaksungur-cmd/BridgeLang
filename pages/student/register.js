'use client';
import { useState } from 'react';
import { auth, db } from '../../lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getErrorMessage, getErrorCode } from '../../utils/firebaseErrors';
import { Check, ChevronRight, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';

export default function StudentRegister() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    country: 'United Kingdom',
    nativeLanguage: '',
    learningGoals: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  const learningGoalCategories = {
    'Exam & Academic Goals': [
      'IELTS (Academic / General)',
      'TOEFL (iBT)',
      'PTE (Pearson Test of English)',
      'Cambridge Exams',
      'OET (Occupational English Test)',
      'SAT / ACT English',
      'EAP (English for Academic Purposes)',
      'Essay Writing / Research Skills',
      'Academic Presentations'
    ],
    'Professional & Career Goals': [
      'Business English',
      'Workplace Communication & Writing',
      'Interview Preparation',
      'Presentation Skills',
      'English for Healthcare / Nursing (NHS)',
      'English for IT / Engineering / Technology',
      'English for Hospitality / Tourism',
      'English for Retail / Customer Service',
      'CV & Cover Letter Writing'
    ],
    'General & Social Goals': [
      'Everyday English',
      'Conversational Fluency',
      'Grammar & Writing Skills',
      'Pronunciation & Accent Reduction',
      'Listening & Speaking Confidence',
      'English for Travel',
      'Cultural English (films, music, media)',
      'Modern English Expressions and Fluency'
    ],
    'Personal & Integration Goals': [
      'English for Immigration / Citizenship',
      'English for Life in the UK',
      'Parent Support English',
      'Social English',
      'Integration & Cultural Understanding',
      'English for Hobbies',
      'Other'
    ],
    'Digital & Modern English Goals': [
      'English for Social Media / Influencers',
      'English for Content Creators',
      'English for Remote Work & Freelancing',
      'English for Online Meetings & Presentations',
      'English for AI Tools & Digital Literacy',
      'Email Etiquette & Online Communication',
      'Networking & Collaboration in English'
    ]
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleGoal = (goal) => {
    setForm(prev => ({
      ...prev,
      learningGoals: prev.learningGoals.includes(goal)
        ? prev.learningGoals.filter(g => g !== goal)
        : [...prev.learningGoals, goal]
    }));
  };

  const handleNext = () => {
    setError('');

    if (step === 1) {
      if (!form.name || !form.email || !form.password) {
        setError('Please fill in all required fields.');
        return;
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setStep(step + 1);
  };

  const handlePrev = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const email = form.email.trim().toLowerCase();

      if (form.password.length < 6) {
        throw new Error('auth/weak-password');
      }

      // ✅ CHECK FOR DUPLICATE EMAIL ACROSS ALL ROLES
      console.log('Checking for existing user with email:', email);
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', email));
      const existingUsers = await getDocs(emailQuery);

      if (!existingUsers.empty) {
        const existingUser = existingUsers.docs[0].data();
        const existingRole = existingUser.role;

        if (existingRole === 'student') {
          throw new Error('This email is already registered as a student account. Please sign in or use a different email.');
        } else if (existingRole === 'teacher') {
          throw new Error('This email is already registered as a teacher account. Please sign in or use a different email.');
        } else {
          throw new Error('This email is already in use. Please sign in or use a different email.');
        }
      }

      const { user } = await createUserWithEmailAndPassword(auth, email, form.password);

      await setDoc(doc(db, 'users', user.uid), {
        name: form.name.trim(),
        email,
        country: form.country,
        nativeLanguage: form.nativeLanguage || null,
        learningGoals: form.learningGoals.length > 0 ? form.learningGoals : null,
        role: 'student',
        subscriptionPlan: 'free',
        viewLimit: 10,
        messagesLeft: 5,
        credits: 0,
        emailVerified: false,
        createdAt: new Date(),
      });

      if (process.env.NEXT_PUBLIC_SEND_AUTH_EMAILS === 'true') {
        await fetch('/api/auth/send-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: form.name }),
        }).catch(console.error);
      }

      await fetch('/api/mail/student-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email }),
      }).catch(console.error);

      await signOut(auth);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(getErrorCode(err)));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
              <Image src="/bridgelang.png" alt="BridgeLang" width={40} height={40} />
              <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>BridgeLang</span>
            </Link>
          </div>
        </header>

        <div style={{ flex: '1', background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ width: '100%', maxWidth: '540px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Check style={{ width: '40px', height: '40px', color: '#22c55e' }} />
            </div>
            <h2 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem' }}>
              Welcome to BridgeLang!
            </h2>
            <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '2rem', lineHeight: '1.6' }}>
              Your account has been created successfully. Please check your email to verify your account and get started.
            </p>
            <Link href="/login">
              <button style={{
                padding: '0.75rem 2rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
                onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
              >
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Platform Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <Image src="/bridgelang.png" alt="BridgeLang" width={40} height={40} />
            <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>BridgeLang</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: '1', background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: step === 3 ? '720px' : '560px' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            {/* Progress Bar */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>
                  Step {step} of {totalSteps}
                </span>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: '#3b82f6',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
                {step === 1 ? 'Create Your Account' : step === 2 ? 'Learning Preferences' : 'Your Learning Goals'}
              </h1>
              <p style={{ fontSize: '0.9375rem', color: '#64748b' }}>
                {step === 1 ? 'Enter your basic information' : step === 2 ? 'Tell us about yourself' : 'Select all that apply (optional)'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '0.875rem 1rem',
                marginBottom: '1.5rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                color: '#991b1b'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={step === totalSteps ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                      Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="John Smith"
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 0.875rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.9375rem',
                        color: '#0f172a',
                        background: 'white',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                      Email Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="john@example.com"
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 0.875rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.9375rem',
                        color: '#0f172a',
                        background: 'white',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                      Password <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: '0 0 0.375rem 0' }}>
                      At least 6 characters
                    </p>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 0.875rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.9375rem',
                        color: '#0f172a',
                        background: 'white',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                      Country
                    </label>
                    <select
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 0.875rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.9375rem',
                        color: '#0f172a',
                        background: 'white',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option>United Kingdom</option>
                      <option>Turkey</option>
                      <option>United States</option>
                      <option>Canada</option>
                      <option>Australia</option>
                      <option>Germany</option>
                      <option>France</option>
                      <option>Spain</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Basic Preferences */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                      Native Language
                    </label>
                    <select
                      name="nativeLanguage"
                      value={form.nativeLanguage}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 0.875rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.9375rem',
                        color: '#0f172a',
                        background: 'white',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Select...</option>
                      <option>English</option>
                      <option>Spanish</option>
                      <option>Arabic</option>
                      <option>Mandarin</option>
                      <option>Turkish</option>
                      <option>French</option>
                      <option>German</option>
                      <option>Portuguese</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Learning Goals */}
              {step === 3 && (
                <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {Object.entries(learningGoalCategories).map(([category, goals]) => (
                    <div key={category} style={{ marginBottom: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        style={{
                          width: '100%',
                          padding: '0.875rem 1rem',
                          background: expandedCategories[category] ? '#f8fafc' : 'white',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          fontSize: '0.9375rem',
                          fontWeight: '600',
                          color: '#0f172a',
                          transition: 'background 0.2s'
                        }}
                      >
                        <span>{category}</span>
                        {expandedCategories[category] ?
                          <ChevronUp style={{ width: '18px', height: '18px', color: '#64748b' }} /> :
                          <ChevronDown style={{ width: '18px', height: '18px', color: '#64748b' }} />
                        }
                      </button>
                      {expandedCategories[category] && (
                        <div style={{ padding: '0.75rem 1rem', background: 'white', borderTop: '1px solid #f1f5f9' }}>
                          {goals.map(goal => (
                            <label key={goal} style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0.5rem 0',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#475569'
                            }}>
                              <input
                                type="checkbox"
                                checked={form.learningGoals.includes(goal)}
                                onChange={() => toggleGoal(goal)}
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  marginRight: '0.75rem',
                                  cursor: 'pointer',
                                  accentColor: '#3b82f6'
                                }}
                              />
                              {goal}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {form.learningGoals.length > 0 && (
                    <div style={{ marginTop: '1rem', padding: '0.875rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>
                        Selected: {form.learningGoals.length} goal{form.learningGoals.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                    <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0', lineHeight: '1.5' }}>
                      By creating an account, you agree to our{' '}
                      <Link href="/terms" style={{ color: '#3b82f6', textDecoration: 'none' }}>Terms & Conditions</Link>
                      {' '}and{' '}
                      <Link href="/privacy" style={{ color: '#3b82f6', textDecoration: 'none' }}>Privacy Policy</Link>.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    style={{
                      flex: '1',
                      height: '48px',
                      background: 'white',
                      color: '#64748b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.target.style.borderColor = '#94a3b8'; e.target.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.background = 'white'; }}
                  >
                    <ChevronLeft style={{ width: '18px', height: '18px' }} />
                    Previous
                  </button>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: '1',
                    height: '48px',
                    background: submitting ? '#94a3b8' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => { if (!submitting) e.target.style.background = '#2563eb'; }}
                  onMouseLeave={(e) => { if (!submitting) e.target.style.background = '#3b82f6'; }}
                >
                  {submitting ? 'Creating account...' : step === totalSteps ? 'Create Account' : 'Next'}
                  {!submitting && step < totalSteps && <ChevronRight style={{ width: '18px', height: '18px' }} />}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#3b82f6', fontWeight: '500', textDecoration: 'none' }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
