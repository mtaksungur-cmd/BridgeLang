// pages/teacher/apply.js
import { useState } from 'react';
import { db, auth } from '../../lib/firebase';
import Link from 'next/link';
import { setDoc, doc, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getBadgesForTeacher } from '../../lib/badgeUtilsClient';
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
    deliveryMethod: 'online',
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

  // ✅ Boş dosya varsa null döndürür
  const uploadFileViaApi = async (file) => {
    if (!file) return null;  // ✅ dosya yoksa null
    try {
      const formData = new FormData();
      formData.append('file', file);
  
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        console.error('upload failed, status:', res.status);
        return null;
      }
  
      const data = await res.json();
      if (!data?.url) {
        console.error('upload returned no url:', data);
        return null;
      }
  
      return data.url;   // ✅ string garanti
    } catch (err) {
      console.error('uploadFileViaApi error:', err);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requiredChecks = [
      'confirmInfo',
      'agreeTerms',
      'acceptResponsibility',
      'cancellationAware',
      'acceptPrivacy',
    ];
    for (let key of requiredChecks) {
      if (!form[key]) return alert('Please check all confirmations before submitting.');
    }

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        form.email.trim().toLowerCase(),
        form.password
      );
      const uid = userCred.user.uid;

      // ✅ Dosya yükleme
      const profilePhotoUrl = await uploadFileViaApi(files.profilePhoto);
      const cvUrl = await uploadFileViaApi(files.cvFile);
      const introVideoUrl = await uploadFileViaApi(files.introVideo);

      const certificationUrls = [];
      for (let cert of files.certificateFiles) {
        const url = await uploadFileViaApi(cert);
        if (url) certificationUrls.push(url);
      }

      await setDoc(doc(db, 'pendingTeachers', uid), {
        ...form,
        email: form.email.trim().toLowerCase(),
        ...(profilePhotoUrl ? { profilePhotoUrl } : {}),
        ...(cvUrl ? { cvUrl } : {}),
        ...(introVideoUrl ? { introVideoUrl } : {}),
        certificationUrls: certificationUrls.filter(Boolean),
        status: 'pending',
        createdAt: Timestamp.now(),
        role: 'teacher',
        badges: []
      });

      await getBadgesForTeacher(uid); // istersen açabilirsin

      setSuccess(
        '✅ Your application has been submitted. You will be contacted within 3–5 business days.'
      );
    } catch (err) {
      alert('❌ Failed to submit application');
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Apply to Teach with BridgeLang</h2>
      <p className={styles.lead}>
        Join our UK-based platform to teach online or in person. Fill in the form
        below.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid2}>
          <input
            className={styles.input}
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            className={styles.input}
            name="email"
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            className={styles.input}
            name="password"
            type="password"
            placeholder="Password (required for login after approval)"
            value={form.password}
            onChange={handleChange}
            required
          />

          <input
            className={styles.input}
            name="homeAddress"
            placeholder="Home Address"
            value={form.homeAddress}
            onChange={handleChange}
            required
          />

          <select
            name="country"
            className={styles.select}
            value={form.country}
            onChange={handleChange}
            required
          >
            {UK_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            className={styles.input}
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            required
          />

          <input
            className={styles.input}
            name="postcode"
            placeholder="Postcode"
            value={form.postcode}
            onChange={handleChange}
            required
          />

          <input
            className={styles.input}
            name="platformExperience"
            placeholder="Platform Experience (e.g., Zoom, Skype)"
            value={form.platformExperience}
            onChange={handleChange}
          />
        </div>

        <h4 className={styles.sectionTitle}>Languages & Experience</h4>
        <div className={styles.grid2}>
          <input
            className={styles.input}
            name="languagesTaught"
            placeholder="Languages You Teach"
            value={form.languagesTaught}
            onChange={handleChange}
            required
          />
          <input
            className={styles.input}
            name="languagesSpoken"
            placeholder="Languages You Speak Fluently"
            value={form.languagesSpoken}
            onChange={handleChange}
            required
          />
          <input
            className={styles.input}
            name="experienceYears"
            placeholder="Years of Teaching Experience"
            value={form.experienceYears}
            onChange={handleChange}
            required
          />
          <input
            className={styles.input}
            name="educationLevel"
            placeholder="Highest Education Level"
            value={form.educationLevel}
            onChange={handleChange}
            required
          />
          <input
            className={styles.input}
            name="lessonTypes"
            placeholder="Lesson Types (comma-separated)"
            value={form.lessonTypes}
            onChange={handleChange}
            required
          />
          <input
            className={styles.input}
            name="studentAges"
            placeholder="Student Age Groups"
            value={form.studentAges}
            onChange={handleChange}
            required
          />
          <input
            className={styles.input}
            name="availability"
            placeholder="Available Days and Times"
            value={form.availability}
            onChange={handleChange}
            required
          />

          <input className={styles.input} 
            name="deliveryMethod" 
            placeholder="Delivery Method (e.g., Online via Daily, In-person at student’s home)" 
            value={form.deliveryMethod} 
            onChange={handleChange} 
            required 
          />
        </div>

        <h4 className={styles.sectionTitle}>Pricing</h4>
        <div className={styles.grid3}>
          <input
            className={styles.input}
            name="pricing30"
            placeholder="Price for 30 minutes (£)"
            value={form.pricing30}
            onChange={handleChange}
            required
          />
          <input
            className={styles.input}
            name="pricing45"
            placeholder="Price for 45 minutes (£)"
            value={form.pricing45}
            onChange={handleChange}
            required
          />
          <input
            className={styles.input}
            name="pricing60"
            placeholder="Price for 60 minutes (£)"
            value={form.pricing60}
            onChange={handleChange}
            required
          />
        </div>

        <h4 className={styles.sectionTitle}>Bio</h4>
        <textarea
          className={styles.textarea}
          name="bio"
          placeholder="Short Bio (max 300 words)"
          value={form.bio}
          onChange={handleChange}
          maxLength={300}
        />

        <h4 className={styles.sectionTitle}>Uploads</h4>
        <div className={styles.files}>
          <label className={styles.fileLabel}>
            <span>Profile Photo</span>
            <input
              className={styles.fileInput}
              type="file"
              name="profilePhoto"
              accept="image/*"
              onChange={handleChange}
              required
            />
          </label>

          <label className={styles.fileLabel}>
            <span>CV (PDF)</span>
            <input
              className={styles.fileInput}
              type="file"
              name="cvFile"
              accept=".pdf"
              onChange={handleChange}
              required
            />
          </label>

          <label className={styles.fileLabel}>
            <span>Certificates (PDF, JPG, PNG)</span>
            <input
              className={styles.fileInput}
              type="file"
              name="certificateFiles"
              accept=".pdf,image/*"
              multiple
              onChange={handleChange}
            />
          </label>

          <label className={styles.fileLabel}>
            <span>Intro Video (MP4)</span>
            <input
              className={styles.fileInput}
              type="file"
              name="introVideo"
              accept="video/mp4"
              onChange={handleChange}
            />
          </label>
        </div>

        <h4 className={styles.sectionTitle}>Confirmations</h4>
        <div className={styles.checks}>
          <label className={styles.checkItem}>
            <input
              type="checkbox"
              name="willingToTravel"
              checked={form.willingToTravel}
              onChange={handleChange}
            />
            <span>Willing to travel for lessons</span>
          </label>

          <label className={styles.checkItem}>
            <input
              type="checkbox"
              name="confirmInfo"
              checked={form.confirmInfo}
              onChange={handleChange}
              required
            />
            <span>I confirm that all the information is accurate.</span>
          </label>

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

        <button type="submit" className={styles.submitBtn}>
          Submit Application
        </button>
      </form>

      {success && (
        <div className={styles.successBox}>
          <p className={styles.successText}>{success}</p>
          <p className={styles.successHint}>
            Once your application is submitted, our team will review your details
            and get back to you within 3–5 business days. If approved, you&apos;ll
            receive a link to create your public teacher profile and get started on
            the platform!
          </p>
        </div>
      )}
    </div>
  );
}
