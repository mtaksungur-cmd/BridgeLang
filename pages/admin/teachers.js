import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';

export default function AdminTeachers() {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const fetchApplications = async () => {
      const snap = await getDocs(collection(db, 'pendingTeachers'));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplications(data);
    };

    fetchApplications();
  }, []);

  const approveTeacher = async (app) => {
    try {
      await setDoc(doc(db, 'users', app.id), {
        ...app,
        role: 'teacher',
        status: 'approved',
      });
      await deleteDoc(doc(db, 'pendingTeachers', app.id));
      alert(`✅ ${app.name} approved.`);
      setApplications(applications.filter(a => a.id !== app.id));
    } catch (err) {
      console.error('Approval error:', err);
      alert('❌ Approval failed.');
    }
  };

  const rejectTeacher = async (id) => {
    if (!confirm('Are you sure you want to reject this application?')) return;
    try {
      await deleteDoc(doc(db, 'pendingTeachers', id));
      alert('Application rejected.');
      setApplications(applications.filter(a => a.id !== id));
    } catch (err) {
      console.error('Rejection error:', err);
      alert('❌ Rejection failed.');
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Pending Teacher Applications</h2>
      {applications.length === 0 ? (
        <p>No pending applications.</p>
      ) : (
        applications.map(app => (
          <div key={app.id} style={{ border: '1px solid #ccc', padding: 20, marginBottom: 20 }}>
            <h3>{app.name}</h3>
            <p><strong>Profile Photo:</strong><br />
            {app.profilePhotoUrl ? (
                <a href={app.profilePhotoUrl} target="_blank" rel="noopener noreferrer">
                <img src={app.profilePhotoUrl} alt="Profile" width="100" style={{ borderRadius: 8 }} />
                </a>
            ) : (
                'Not uploaded'
            )}
            </p>
            <p><strong>Bio:</strong><br />{app.bio}</p>
            <p><strong>Email:</strong> {app.email}</p>
            <p><strong>Home Address:</strong> {app.homeAddress}, {app.city}, {app.postcode}</p>
            <p><strong>Timezone:</strong> {app.timezone}</p>

            <hr />

            <p><strong>Languages Taught:</strong> {app.languagesTaught}</p>
            <p><strong>Languages Spoken:</strong> {app.languagesSpoken}</p>
            <p><strong>Experience (years):</strong> {app.experienceYears}</p>
            <p><strong>Education Level:</strong> {app.educationLevel}</p>
            <p><strong>Certificates:</strong><br />
            {app.certificationUrls?.length > 0 ? (
                app.certificationUrls.map((url, idx) => (
                <div key={idx}><a href={url} target="_blank">View Certificate {idx + 1}</a></div>
                ))
            ) : 'None'}
            </p>
            <p><strong>CV:</strong> {app.cvUrl
            ? <a href={app.cvUrl} target="_blank" rel="noopener noreferrer">📄 View CV (PDF)</a>
            : 'Not uploaded'}
            </p>
            <p><strong>Intro Video:</strong><br />
            {app.introVideoUrl ? (
                <video width="320" height="240" controls>
                <source src={app.introVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
                </video>
            ) : 'Not uploaded'}
            </p>

            <hr />

            <p><strong>Lesson Types:</strong> {app.lessonTypes}</p>
            <p><strong>Student Ages:</strong> {app.studentAges}</p>
            <p><strong>Availability:</strong> {app.availability}</p>
            <p><strong>Pricing:</strong><br />
              30 min: £{app.pricing30}<br />
              45 min: £{app.pricing45}<br />
              60 min: £{app.pricing60}</p>
            <p><strong>Platform Experience:</strong> {app.platformExperience}</p>
            <p><strong>Delivery Method:</strong> {app.deliveryMethod}</p>
            <p><strong>Willing to travel:</strong> {app.willingToTravel ? 'Yes' : 'No'}</p>

            <hr />


            <hr />

            <button onClick={() => approveTeacher(app)}>✅ Approve</button>{' '}
            <button onClick={() => rejectTeacher(app.id)} style={{ color: 'red' }}>❌ Reject</button>
          </div>
        ))
      )}
    </div>
  );
}
