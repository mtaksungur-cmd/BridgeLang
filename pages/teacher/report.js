import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import styles from '../../scss/TeacherReport.module.scss';

export default function TeacherReport() {
  const [form, setForm] = useState({ reason: '', description: '' });
  const [userId, setUserId] = useState('');
  const [bookingId, setBookingId] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setBookingId(router.query.bookingId || null);
    onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
  }, [router.query.bookingId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'complaints'), {
      userId,
      role: 'teacher',
      bookingId,
      reason: form.reason,
      description: form.description,
      createdAt: Timestamp.now(),
      status: 'pending',
    });
    setSuccess(true);
  };

  return (
      <div className={styles.container}>
        <h2 className={styles.title}>Submit a Complaint</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="reason" className={styles.label}>Reason</label>
            <select
              id="reason"
              name="reason"
              required
              onChange={handleChange}
              className={styles.select}
              value={form.reason}
            >
              <option value="">-- Select Reason --</option>
              <option value="Abuse">Abuse</option>
              <option value="No Show">Student didn’t attend</option>
              <option value="Rude Behavior">Rude behavior</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="description" className={styles.label}>Description</label>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              onChange={handleChange}
              value={form.description}
              className={styles.textarea}
              placeholder="Please describe the issue in detail…"
            />
          </div>

          <button type="submit" className={`bg-danger ${styles.submit}`}>Submit Complaint</button>
        </form>

        {success && (
          <p className={styles.success}>✅ Complaint submitted successfully.</p>
        )}
      </div>
  );
}
