import { useState } from 'react';
import { db, auth, storage } from '../../lib/firebase';
import { setDoc, doc, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { updateBadgesForTeacher } from '../../lib/badgeUtils';

export default function TeacherApply() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password:'',
    homeAddress: '',
    city: '',
    postcode: '',
    timezone: '',
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
    const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    });
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
        const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
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
            profilePhotoUrl,      
            cvUrl,      
            introVideoUrl,
            certificationUrls,
            status: 'pending',
            createdAt: Timestamp.now()
      });
      await updateBadgesForTeacher(newTeacherId);
      setSuccess('✅ Your application has been submitted. You will be contacted within 3–5 business days.');
      setForm({});
    } catch (err) {
      alert('❌ Failed to submit application');
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: 'auto' }}>
      <h2>Apply to Teach with BridgeLang</h2>
      <p>Join our UK-based platform to teach online or in person. Fill in the form below.</p>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required /><br />
        <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} required /><br />
        <input name="password" type="password" placeholder="Password (required for login after approval)" value={form.password} onChange={handleChange} required/><br/>
        <input name="homeAddress" placeholder="Home Address" value={form.homeAddress} onChange={handleChange} required /><br />
        <input name="city" placeholder="City" value={form.city} onChange={handleChange} required /><br />
        <input name="postcode" placeholder="Postcode" value={form.postcode} onChange={handleChange} required /><br />
        <input name="timezone" placeholder="Timezone (e.g. GMT+1)" value={form.timezone} onChange={handleChange} required /><br />
        <input name="languagesTaught" placeholder="Languages You Teach" value={form.languagesTaught} onChange={handleChange} required /><br />
        <input name="languagesSpoken" placeholder="Languages You Speak Fluently" value={form.languagesSpoken} onChange={handleChange} required /><br />
        <input name="experienceYears" placeholder="Years of Teaching Experience" value={form.experienceYears} onChange={handleChange} required /><br />
        <input name="educationLevel" placeholder="Highest Education Level" value={form.educationLevel} onChange={handleChange} required /><br />
        <input name="lessonTypes" placeholder="Lesson Types (comma-separated)" value={form.lessonTypes} onChange={handleChange} required /><br />
        <input name="studentAges" placeholder="Student Age Groups" value={form.studentAges} onChange={handleChange} required /><br />
        <input name="availability" placeholder="Available Days and Times" value={form.availability} onChange={handleChange} required /><br />
        <input name="pricing30" placeholder="Price for 30 minutes (£)" value={form.pricing30} onChange={handleChange} required /><br />
        <input name="pricing45" placeholder="Price for 45 minutes (£)" value={form.pricing45} onChange={handleChange} required /><br />
        <input name="pricing60" placeholder="Price for 60 minutes (£)" value={form.pricing60} onChange={handleChange} required /><br />
        <input name="platformExperience" placeholder="Platform Experience (e.g., Zoom, Skype)" value={form.platformExperience} onChange={handleChange} /><br />
        <input name="deliveryMethod" placeholder="Delivery Method" value={form.deliveryMethod} onChange={handleChange} required /><br />
        <label><input type="checkbox" name="willingToTravel" checked={form.willingToTravel} onChange={handleChange} /> Willing to travel for lessons</label><br />
        <textarea name="bio" placeholder="Short Bio (max 300 words)" value={form.bio} onChange={handleChange} maxLength={300} /><br />
        
        <label>Profile Photo:</label><br />
        <input type="file" name="profilePhoto" accept="image/*" onChange={handleChange} required/><br />

        <label>CV (PDF):</label><br />
        <input type="file" name="cvFile" accept=".pdf" onChange={handleChange} required/><br />

        <label>Certificates (PDF, JPG, PNG):</label><br />
        <input type="file" name="certificateFiles" accept=".pdf,image/*" multiple onChange={handleChange} /><br />

        <label>Intro Video (MP4):</label><br />
        <input type="file" name="introVideo" accept="video/mp4" onChange={handleChange} /><br />

        <label><input type="checkbox" name="confirmInfo" checked={form.confirmInfo} onChange={handleChange} required/> I confirm that all the information is accurate.</label><br />
        <label><input type="checkbox" name="agreeTerms" checked={form.agreeTerms} onChange={handleChange} required/> I agree to BridgeLang's Teacher Terms.</label><br />
        <label><input type="checkbox" name="acceptResponsibility" checked={form.acceptResponsibility} onChange={handleChange} required/> I understand I'm responsible for my schedule and rates.</label><br />
        <label><input type="checkbox" name="cancellationAware" checked={form.cancellationAware} onChange={handleChange} required/> I acknowledge the 24-hour cancellation policy.</label><br />
        <label><input type="checkbox" name="acceptPrivacy" checked={form.acceptPrivacy} onChange={handleChange} required/> I accept the Privacy Policy & GDPR Terms.</label><br /><br />

        <button type="submit">Submit Application</button>
      </form>
      {success && (
        <div style={{ marginTop: 20 }}>
          <p style={{ color: 'green' }}>{success}</p>
          <p style={{ fontStyle: 'italic' }}>
            Once your application is submitted, our team will review your details and get back to you within 3–5 business days. If approved, you'll receive a link to create your public teacher profile and get started on the platform!
          </p>
        </div>
      )}
    </div>
  );
}
