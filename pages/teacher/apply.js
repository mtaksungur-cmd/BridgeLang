'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../../lib/firebase';
import Link from 'next/link';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ChevronRight, ChevronLeft, Check, User, BookOpen, PoundSterling, FileText, Globe, ShieldCheck, Video } from 'lucide-react';
import styles from '../../scss/TeacherApply.module.scss';
import Image from 'next/image';

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
    pricing30: '', pricing60: '', deliveryMethod: 'Both', willingToTravel: false,
    bio: '', videoIntroUrl: '',
    cvUrl: '', certificationUrls: [],
  });

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

      // Check if this email was previously deleted
      try {
        const checkRes = await fetch('/api/auth/check-deleted-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.deleted) {
            setError('This email address has been previously removed and cannot be used to register again.');
            setSubmitting(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Deleted email check failed, continuing registration:', e);
      }

      const { user } = await createUserWithEmailAndPassword(auth, email, form.password);
      await setDoc(doc(db, 'pendingTeachers', user.uid), {
        name: form.name.trim(), email, country: form.country, city: form.city || '',
        role: 'teacher', approved: false, status: 'pending', emailVerified: true,
        specialties: form.specialty, teachingSpecializations: form.specialty.join(', '),
        experienceYears: form.experienceYears, certifications: form.certifications,
        pricing30: Number(form.pricing30), pricing60: Number(form.pricing60),
        deliveryMethod: form.deliveryMethod, willingToTravel: form.willingToTravel,
        bio: form.bio || '', videoIntroUrl: form.videoIntroUrl || '',
        cvUrl: form.cvUrl || '', certificationUrls: form.certificationUrls || [],
        createdAt: new Date(),
      });

      // Admin'e yeni öğretmen bildirimi (contact@bridgelang.co.uk veya ADMIN_NOTIFY_EMAIL)
      const adminRes = await fetch('/api/mail/admin-new-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email,
          specialty: (form.specialty || []).join(', '),
        }),
      }).catch((e) => ({ ok: false, status: 0 }));
      if (!adminRes?.ok) console.error('[apply] Admin notify failed', adminRes?.status);

      // Öğretmene "başvurunuz alındı" onay maili
      const teacherMailRes = await fetch('/api/mail/teacher-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email }),
      }).catch((e) => ({ ok: false }));
      if (!teacherMailRes?.ok) console.error('[apply] Teacher application mail failed');

      await signOut(auth);
      setSuccess(true);
    } catch (err) {
      setError('Registration failed. Please check your information.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { id: 1, label: 'Account & Location', icon: <User size={18} /> },
    { id: 2, label: 'Teaching Profile', icon: <BookOpen size={18} /> },
    { id: 3, label: 'Pricing', icon: <PoundSterling size={18} /> },
    { id: 4, label: 'Uploads & Verification', icon: <FileText size={18} /> }
  ];

  if (success) {
    return (
      <div className={styles.applyPage}>
        <div className={styles.successCard}>
          <div className={styles.icon}><Check size={40} /></div>
          <h2>Application Sent!</h2>
          <p>We review applications within 1-2 business days. Keep an eye on your email for the next steps.</p>
          <Link href="/login" className={styles.btnNext} style={{ width: '100%', justifyContent: 'center' }}>Return to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.applyPage}>
      <header className={styles.header}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: '2rem' }}>
          <Image src="/bridgelang.png" alt="Logo" width={50} height={50} />
        </Link>
        <h1>Apply to Teach with BridgeLang</h1>
        <p>Complete the form below and upload your documents for verification.</p>
        <div className={styles.badges}>
          <div><Globe size={16} /> UK-based tutors only</div>
          <span>•</span>
          <div><Video size={16} /> Online & in-person options</div>
          <span>•</span>
          <div><ShieldCheck size={16} /> Review in 1-2 business days</div>
        </div>
      </header>

      <div className={styles.applyCard}>
        <aside className={styles.sidebar}>
          {steps.map((s) => (
            <div key={s.id} className={`${styles.stepItem} ${step === s.id ? styles.active : ''} ${step > s.id ? styles.completed : ''}`}>
              <div className={styles.stepIcon}>{step > s.id ? <Check size={16} /> : s.icon}</div>
              <span className={styles.stepLabel}>{s.label}</span>
            </div>
          ))}
        </aside>

        <main className={styles.content}>
          <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
            {error && <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', borderRadius: '10px', marginBottom: '2rem', fontSize: '0.875rem' }}>{error}</div>}

            {step === 1 && (
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>Full Name *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g. John Doe" required />
                </div>
                <div className={styles.inputGroup}>
                  <label>Email Address *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="e.g. john@example.com" required />
                </div>
                <div className={styles.inputGroup}>
                  <label>Password *</label>
                  <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" required />
                </div>
                <div className={styles.inputGroup}>
                  <label>Country *</label>
                  <select name="country" value={form.country} onChange={handleChange} required>
                    <option value="">Select Country</option>
                    <option value="England">England</option>
                    <option value="Scotland">Scotland</option>
                    <option value="Wales">Wales</option>
                    <option value="Northern Ireland">Northern Ireland</option>
                  </select>
                </div>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>City *</label>
                  <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="e.g. London" required />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className={styles.formGrid}>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>What do you teach? * (Select all that apply)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                    {SPECIALTIES.map(spec => (
                      <label key={spec} className={styles.checkboxGroup}>
                        <input type="checkbox" checked={form.specialty.includes(spec)} onChange={() => toggleArrayItem('specialty', spec)} />
                        <span>{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`} style={{ marginTop: '1rem' }}>
                  <label>Years of Teaching Experience *</label>
                  <select name="experienceYears" value={form.experienceYears} onChange={handleChange} required>
                    <option value="">Select Experience</option>
                    <option value="1">1 year</option>
                    <option value="2">2 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>30-Min Lesson Rate (£) *</label>
                  <input type="number" name="pricing30" value={form.pricing30} onChange={handleChange} placeholder="e.g. 15" required />
                </div>
                <div className={styles.inputGroup}>
                  <label>60-Min Lesson Rate (£) *</label>
                  <input type="number" name="pricing60" value={form.pricing60} onChange={handleChange} placeholder="e.g. 25" required />
                </div>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Teaching Method *</label>
                  <select name="deliveryMethod" value={form.deliveryMethod} onChange={handleChange} required>
                    <option value="Online">Online Only</option>
                    <option value="In-Person">In-Person Only</option>
                    <option value="Both">Both Online & In-Person</option>
                  </select>
                </div>
                <div className={`${styles.fullWidth}`}>
                  <label className={styles.checkboxGroup}>
                    <input type="checkbox" name="willingToTravel" checked={form.willingToTravel} onChange={handleChange} />
                    <span>I am willing to travel to student's location for in-person lessons.</span>
                  </label>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className={styles.formGrid}>
                {/* CV & Certifications - shown first in Uploads step */}
                <div className={`${styles.inputGroup} ${styles.fullWidth}`} style={{ padding: '1.25rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', marginBottom: '0.5rem' }}>
                  <label style={{ color: '#166534', fontWeight: '700' }}>📄 Upload CV (Optional)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { setError('CV file must be under 5MB'); return; }
                      try {
                        const fd = new FormData();
                        fd.append('file', file);
                        const res = await fetch('/api/upload', { method: 'POST', body: fd });
                        const data = await res.json();
                        if (data.url) setForm(prev => ({ ...prev, cvUrl: data.url }));
                        else setError('CV upload failed');
                      } catch { setError('CV upload failed'); }
                    }}
                    style={{ width: '100%', padding: '0.75rem 0.875rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9375rem' }}
                  />
                  {form.cvUrl && <p style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.375rem' }}>✅ CV uploaded</p>}
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.375rem' }}>PDF, DOC or DOCX (max 5MB)</p>
                </div>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`} style={{ padding: '1.25rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', marginBottom: '0.5rem' }}>
                  <label style={{ color: '#166534', fontWeight: '700' }}>📜 Upload Certifications (Optional)</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    onChange={async (e) => {
                      const files = Array.from(e.target.files);
                      if (files.length === 0) return;
                      const oversized = files.find(f => f.size > 5 * 1024 * 1024);
                      if (oversized) { setError('Each file must be under 5MB'); return; }
                      try {
                        const urls = [];
                        for (const file of files) {
                          const fd = new FormData();
                          fd.append('file', file);
                          const res = await fetch('/api/upload', { method: 'POST', body: fd });
                          const data = await res.json();
                          if (data.url) urls.push(data.url);
                        }
                        setForm(prev => ({ ...prev, certificationUrls: [...(prev.certificationUrls || []), ...urls] }));
                      } catch { setError('Certification upload failed'); }
                    }}
                    style={{ width: '100%', padding: '0.75rem 0.875rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9375rem' }}
                  />
                  {form.certificationUrls?.length > 0 && (
                    <p style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.375rem' }}>✅ {form.certificationUrls.length} certification(s) uploaded</p>
                  )}
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.375rem' }}>PDF, JPG or PNG (max 5MB each)</p>
                </div>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Professional Bio *</label>
                  <textarea name="bio" value={form.bio} onChange={handleChange} rows="6" placeholder="Share your experience, teaching style and how you help students..." required />
                </div>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Video Intro URL (YouTube/Vimeo)</label>
                  <input type="url" name="videoIntroUrl" value={form.videoIntroUrl} onChange={handleChange} placeholder="https://" />
                </div>
                <div className={`${styles.fullWidth}`}>
                   <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.5rem' }}>
                    By clicking submit, you confirm that all information provided is accurate and you agree to our Teacher Terms of Service.
                  </p>
                </div>
              </div>
            )}

            <footer className={styles.footer}>
              {step > 1 ? (
                <button type="button" onClick={prevStep} className={styles.btnBack}>
                  <ChevronLeft size={20} /> Back
                </button>
              ) : <div />}
              
              <button type="submit" disabled={submitting} className={styles.btnNext}>
                {submitting ? 'Processing...' : step === 4 ? 'Submit Application' : 'Next'} 
                {step < 4 && <ChevronRight size={20} />}
              </button>
            </footer>
          </form>
        </main>
      </div>
    </div>
  );
}
