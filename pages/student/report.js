import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import StudentLayout from '../../components/StudentLayout';
import styles from "../../scss/StudentReport.module.scss";

export default function StudentReport() {
  const [form, setForm] = useState({ reason: '', description: '' });
  const [userId, setUserId] = useState('');
  const [bookingId, setBookingId] = useState(null);
  const [teacherId, setTeacherId] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const { bookingId, teacherId, target } = router.query;
    if (bookingId) setBookingId(bookingId);
    if (teacherId || target) setTeacherId(teacherId || target);

    onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
  }, [router.query]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bookingId && !teacherId) return alert('Missing booking or teacher reference.');

    await addDoc(collection(db, 'complaints'), {
      userId,
      role: 'student',
      bookingId: bookingId || null,
      teacherId: teacherId || null,
      reason: form.reason,
      description: form.description,
      createdAt: Timestamp.now(),
      status: 'pending',
    });
    setSuccess(true);
  };

  return (
    <StudentLayout>
      <div className={styles.container}>
        <h2 className={styles.title}>Submit a Complaint</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Reason:
            <select name="reason" required onChange={handleChange} className={styles.select}>
              <option value="">-- Select Reason --</option>
              <option value="Abuse">Abuse</option>
              <option value="Lateness">Lateness</option>
              <option value="Low Quality Lesson">Low Quality Lesson</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label className={styles.label}>
            Description:
            <textarea
              name="description"
              required
              rows={5}
              onChange={handleChange}
              className={styles.textarea}
            ></textarea>
          </label>

          <button type="submit" className={styles.submitBtn}>Submit Complaint</button>
        </form>

        {success && <p className={styles.successMsg}>✅ Complaint submitted successfully.</p>}
      </div>
    </StudentLayout>
  );
}
