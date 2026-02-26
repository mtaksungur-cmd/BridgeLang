'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../../lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getErrorMessage, getErrorCode } from '../../utils/firebaseErrors';
import { Check, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, User, Globe, Target } from 'lucide-react';
import styles from '../../scss/StudentRegister.module.scss';

export default function StudentRegister() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    country: 'United Kingdom',
    nativeLanguage: '',
    birthday: '',
    parentEmail: '',
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
      'EAP (English for Academic Purposes)'
    ],
    'Professional & Career Goals': [
      'Business English',
      'Workplace Communication & Writing',
      'Interview Preparation',
      'Presentation Skills',
      'English for Healthcare / Nursing (NHS)'
    ],
    'Personal & Integration Goals': [
      'English for Immigration / Citizenship',
      'English for Life in the UK',
      'Parent Support English',
      'Social English',
      'Integration & Cultural Understanding'
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
      if (form.password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
    }
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const handlePrev = () => {
    setError('');
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const email = form.email.trim().toLowerCase();

      // Calculate age
      const birthDate = new Date(form.birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 14) {
        setError('You must be at least 14 years old to join BridgeLang.');
        setSubmitting(false);
        return;
      }

      const isMinor = age < 18;
      if (isMinor && !form.parentEmail) {
        setError('Parental email is required for students under 18.');
        setSubmitting(false);
        return;
      }

      // Check if email was previously deleted
      try {
        const checkRes = await fetch('/api/auth/check-deleted-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.deleted) {
            setError('This email address is associated with a previously deleted account and cannot be used to register again.');
            setSubmitting(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Deleted email check failed, continuing registration:', e);
      }

      const { user } = await createUserWithEmailAndPassword(auth, email, form.password);

      await setDoc(doc(db, 'users', user.uid), {
        name: form.name.trim(),
        email,
        role: 'student',
        country: form.country,
        birthday: form.birthday,
        age: age,
        parentEmail: isMinor ? form.parentEmail : null,
        nativeLanguage: form.nativeLanguage || null,
        learningGoals: form.learningGoals.length > 0 ? form.learningGoals : null,
        subscriptionPlan: 'free',
        viewLimit: 10,
        messagesLeft: 5,
        credits: 0,
        emailVerified: false,
        status: isMinor ? 'pending_consent' : 'active',
        createdAt: new Date(),
      });

      // Trigger Parent Consent API if minor (14–17) — must succeed before showing success
      if (isMinor) {
        const parentEmailTrimmed = (form.parentEmail || '').trim().toLowerCase();
        const consentRes = await fetch('/api/parent-consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: user.uid,
            studentName: form.name.trim(),
            parentName: null,
            parentEmail: parentEmailTrimmed,
            dob: form.birthday,
          }),
        });
        if (!consentRes.ok) {
          const errData = await consentRes.json().catch(() => ({}));
          const msg = errData.error || 'Could not send the parental consent email. Please contact support.';
          setError(errData.details ? `${msg} (${errData.details})` : msg);
          // Rollback: remove the just-created user so they can try again (avoid "email already registered")
          try {
            const token = await user.getIdToken();
            await fetch('/api/auth/rollback-student-registration', {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch (rollbackErr) {
            console.warn('Rollback failed:', rollbackErr);
          }
          setSubmitting(false);
          return;
        }
      }

      // Send welcome email to the new student (before signOut so we can send token for verification)
      try {
        const token = await user.getIdToken();
        await fetch('/api/mail/student-welcome', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email, name: form.name.trim() }),
        });
      } catch (welcomeErr) {
        console.warn('Welcome email request failed (account still created):', welcomeErr);
      }

      await signOut(auth);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(getErrorCode(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { id: 1, label: 'Account Details', icon: <User size={18} /> },
    { id: 2, label: 'Preferences', icon: <Globe size={18} /> },
    { id: 3, label: 'Learning Goals', icon: <Target size={18} /> }
  ];

  if (success) {
    const birthDate = new Date(form.birthday);
    const today = new Date();
    let successAge = today.getFullYear() - birthDate.getFullYear();
    const sm = today.getMonth() - birthDate.getMonth();
    if (sm < 0 || (sm === 0 && today.getDate() < birthDate.getDate())) successAge--;
    const isMinorSuccess = successAge < 18;

    return (
      <div className={styles.registerPage}>
        <div className={styles.successCard}>
          <div className={styles.icon}><Check size={40} /></div>
          {isMinorSuccess ? (
            <>
              <h2>Almost there!</h2>
              <p>Your account has been created, but since you are under 18, we need your parent/guardian's consent before you can log in.</p>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
                A confirmation email has been sent to <strong>{form.parentEmail}</strong>. Once they approve, you'll be able to sign in and start learning.
              </p>
            </>
          ) : (
            <>
              <h2>Welcome to BridgeLang!</h2>
              <p>Your student account has been created successfully. You can now log in and start exploring tutors.</p>
              <Link href="/login" className={styles.btnNext} style={{ width: '100%', justifyContent: 'center' }}>Sign In</Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.registerPage}>
      <header className={styles.header}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
          <Image src="/bridgelang.png" alt="Logo" width={50} height={50} />
        </Link>
        <h1>Create your account</h1>
        <p>Join thousands of learners building their future in the UK.</p>
      </header>

      <div className={styles.registerCard}>
        <aside className={styles.sidebar}>
          {steps.map((s) => (
            <div key={s.id} className={`${styles.stepItem} ${step === s.id ? styles.active : ''} ${step > s.id ? styles.completed : ''}`}>
              <div className={styles.stepIcon}>{step > s.id ? <Check size={16} /> : s.icon}</div>
              <span className={styles.stepLabel}>{s.label}</span>
            </div>
          ))}
        </aside>

        <main className={styles.content}>
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {error && <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', borderRadius: '10px', marginBottom: '2rem', fontSize: '0.875rem' }}>{error}</div>}

            {step === 1 && (
              <div className={styles.formGrid}>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Full Name</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g. John Smith" required />
                </div>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Email Address</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="e.g. john@example.com" required />
                </div>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Password</label>
                  <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Password must be at least 8 characters" required />
                </div>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Country</label>
                  <select name="country" value={form.country} onChange={handleChange} required>
                    <option value="England">England</option>
                    <option value="Scotland">Scotland</option>
                    <option value="Wales">Wales</option>
                    <option value="Northern Ireland">Northern Ireland</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Date of Birth</label>
                  <input type="date" name="birthday" value={form.birthday} onChange={handleChange} required />
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                    Users aged 14–17 require parental consent.
                  </p>
                </div>
                {form.birthday && (() => {
                  const birthDate = new Date(form.birthday);
                  const today = new Date();
                  let age = today.getFullYear() - birthDate.getFullYear();
                  const m = today.getMonth() - birthDate.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                  if (age >= 14 && age < 18) {
                    return (
                      <div className={`${styles.inputGroup} ${styles.fullWidth}`} style={{ marginTop: '1rem', padding: '1rem', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7' }}>
                        <label style={{ color: '#92400e' }}>Parent/Guardian Email Address *</label>
                        <input 
                          type="email" 
                          name="parentEmail" 
                          value={form.parentEmail} 
                          onChange={handleChange} 
                          placeholder="e.g. parent@example.com" 
                          required 
                          style={{ borderColor: '#fcd34d' }}
                        />
                        <p style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.5rem' }}>
                          A consent link will be sent to your parent/guardian.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className={styles.fullWidth}>
                  <label className={styles.checkboxGroup}>
                    <input type="checkbox" required />
                    <span>I agree to the <Link href="/terms" style={{color:'#4a6fbd', fontWeight:'600'}}>Terms & Conditions</Link> and <Link href="/privacy" style={{color:'#4a6fbd', fontWeight:'600'}}>Privacy Policy</Link></span>
                  </label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className={styles.formGrid}>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Native Language (Optional)</label>
                  <input type="text" name="nativeLanguage" value={form.nativeLanguage} onChange={handleChange} placeholder="e.g. Turkish, Arabic, French" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className={styles.formGrid}>
                <div className={styles.fullWidth}>
                  <label style={{display:'block', fontSize:'0.9375rem', fontWeight:'700', color:'#1e293b', marginBottom:'1.5rem'}}>Select what matters most to you</label>
                  {Object.entries(learningGoalCategories).map(([category, goals]) => (
                    <div key={category} className={`${styles.categoryCard} ${expandedCategories[category] ? styles.expanded : ''}`}>
                      <button type="button" className={styles.categoryHeader} onClick={() => toggleCategory(category)}>
                        <span>{category}</span>
                        {expandedCategories[category] ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                      </button>
                      {expandedCategories[category] && (
                        <div className={styles.goalList}>
                          {goals.map(goal => (
                            <label key={goal} className={styles.goalItem}>
                              <input type="checkbox" checked={form.learningGoals.includes(goal)} onChange={() => toggleGoal(goal)} />
                              <span>{goal}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <footer className={styles.footer}>
              {step > 1 ? (
                <button type="button" onClick={handlePrev} className={styles.btnBack}>
                  <ChevronLeft size={20} /> Previous
                </button>
              ) : <div />}
              
              <button type="submit" disabled={submitting} className={styles.btnNext}>
                {submitting ? 'Creating account...' : step === 3 ? 'Register' : 'Next'} 
                {step < 3 && <ChevronRight size={20} />}
              </button>
            </footer>
          </form>
        </main>
      </div>
      <p style={{marginTop:'2rem', fontSize:'0.875rem', color:'#64748b'}}>Already have an account? <Link href="/login" style={{color:'#4a6fbd', fontWeight:'700'}}>Sign In</Link></p>
    </div>
  );
}
