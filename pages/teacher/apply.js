import { useState } from 'react';
import { db, auth } from '../../lib/firebase';
import Link from 'next/link';
import { setDoc, doc, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { updateBadgesForTeacher } from '../../lib/badgeUtils';
import styles from '../../scss/TeacherApply.module.scss';

const UK_COUNTRIES = ['England', 'Scotland', 'Wales', 'Northern Ireland'];
const TIMEZONES = [
  { id: 'Europe/London', label: 'Europe/London (UK)' },
  { id: 'UTC', label: 'UTC' },
];

const DELIVERY_OPTIONS = [
  { id: 'online', label: 'Online' },
  { id: 'in-person', label: 'In person' },
  { id: 'both', label: 'Both' },
];

export default function TeacherApply() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    homeAddress: '',
    city: '',
    country: 'England',
    postcode: '',
    timezone: 'Europe/London',
    languagesTaught: '',
    languagesSpoken: '',
    experienceYears: '',
    educationLevel: '',
    lessonTypes: '',
    studentAges: '',
    availability: '',
    pricing30: '',
    pricing45: '',
    pricing60: '',
    platformExperience: '',
    deliveryMethod: '',
    willingToTravel: false,
    bio: '',
    confirmInfo: false,
    agreeTerms: false,
    acceptResponsibility: false,
    cancellationAware: false,
    acceptPrivacy: false,
  });

  const [files, setFiles] = useState({
    profilePhoto: null,
    cvFile: null,
    introVideo: null,
    certificateFiles: [],
  });

  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked, files: fileList } = e.target;
    if (type === 'file') {
      if (name === 'certificateFiles') {
        setFiles((prev) => ({ ...prev, certificateFiles: Array.from(fileList) }));
      } else {
        setFiles((prev) => ({ ...prev, [name]: fileList[0] }));
      }
    } else if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: checked }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requiredChecks = ['confirmInfo', 'agreeTerms', 'acceptResponsibility', 'cancellationAware', 'acceptPrivacy'];
    for (let key of requiredChecks) {
      if (!form[key]) return alert('Please check all confirmations before submitting.');
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, form.email.trim().toLowerCase(), form.password);
      const uid = userCred.user.uid;

      const profilePhotoUrl = files.profilePhoto ? await uploadFileViaApi(files.profilePhoto) : '';
      const cvUrl = files.cvFile ? await uploadFileViaApi(files.cvFile) : '';
      const introVideoUrl = files.introVideo ? await uploadFileViaApi(files.introVideo) : '';

      const certificationUrls = [];
      for (let cert of files.certificateFiles) {
        const url = await uploadFileViaApi(cert);
        certificationUrls.push(url);
      }

      await setDoc(doc(db, 'pendingTeachers', uid), {
        ...form,
        email: form.email.trim().toLowerCase(),
        profilePhotoUrl,
        cvUrl,
        introVideoUrl,
        certificationUrls,
        status: 'pending',
        createdAt: Timestamp.now(),
        role: 'teacher',
      });

      // await updateBadgesForTeacher(uid); // aktif etmek istersen aç

      setSuccess('✅ Your application has been submitted. You will be contacted within 3–5 business days.');
    } catch (err) {
      alert('❌ Failed to submit application');
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Apply to Teach with BridgeLang</h2>
      <p className={styles.lead}>
        Join our UK-based platform to teach online or in person. Fill in the form below.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* ... tüm input ve select alanları aynı */}
        <h4 className={styles.sectionTitle}>Confirmations</h4>
        <div className={styles.checks}>
          <label className={styles.checkItem}>
            <input
              type="checkbox"
              name="agreeTerms"
              checked={form.agreeTerms}
              onChange={handleChange}
              required
            />
            <span>I agree to BridgeLang&apos;s Teacher Terms.</span>
          </label>

          <label className={styles.checkItem}>
            <input
              type="checkbox"
              name="acceptResponsibility"
              checked={form.acceptResponsibility}
              onChange={handleChange}
              required
            />
            <span>I understand I&apos;m responsible for my schedule and rates.</span>
          </label>

          <label className={styles.checkItem}>
            <input
              type="checkbox"
              name="cancellationAware"
              checked={form.cancellationAware}
              onChange={handleChange}
              required
            />
            <span>
              I acknowledge the{' '}
              <Link href="/legal/refund" className={styles.inlineLink}>
                Refund &amp; Cancellation Policy
              </Link>
              .
            </span>
          </label>

          <label className={styles.checkItem}>
            <input
              type="checkbox"
              name="acceptPrivacy"
              checked={form.acceptPrivacy}
              onChange={handleChange}
              required
            />
            <span>
              I accept the{' '}
              <Link href="/legal/privacy" className={styles.inlineLink}>
                Privacy Policy
              </Link>
              ,{' '}
              <Link href="/legal/terms" className={styles.inlineLink}>
                Terms of Use
              </Link>{' '}
              &amp;{' '}
              <Link href="/legal/refund" className={styles.inlineLink}>
                Cancellation &amp; Refund Policy
              </Link>
              .
            </span>
          </label>
        </div>

        <button type="submit" className={styles.submitBtn}>Submit Application</button>
      </form>

      {success && (
        <div className={styles.successBox}>
          <p className={styles.successText}>{success}</p>
          <p className={styles.successHint}>
            Once your application is submitted, our team will review your details and get back to you within 3–5 business days. If approved, you&apos;ll receive a link to create your public teacher profile and get started on the platform!
          </p>
        </div>
      )}
    </div>
  );
}
