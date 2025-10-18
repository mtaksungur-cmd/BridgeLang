'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../../lib/firebase';
import { updatePassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import styles from '../../scss/SecuritySettings.module.scss';

export default function SecuritySettings() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setRole(snap.data().role || '');
    };
    fetchRole();
  }, []);

  /* ---------- ŞİFRE DEĞİŞTİR ---------- */
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage('');
    if (newPassword.length < 6)
      return setMessage('Password must be at least 6 characters.');
    if (newPassword !== confirmPassword)
      return setMessage('Passwords do not match.');

    try {
      setLoading(true);
      await updatePassword(auth.currentUser, newPassword);
      setMessage('✅ Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to update password. Please re-authenticate.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- HESABI DURAKLAT ---------- */
  const handlePauseAccount = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/account/pause', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessage('⏸️ Your account has been paused. Check your email to reactivate it.');
      setShowPauseModal(false);
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to pause account.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- HESABI KALICI SİL ---------- */
  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/account/delete', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessage('🗑️ Your account has been deleted.');
      setShowDeleteModal(false);
      router.push('/');
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to delete account.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- ÖDEME GEÇMİŞİ ---------- */
  const goToPayments = () => {
    router.push('/student/payments');
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Account & Security</h2>

      {/* ŞİFRE */}
      <section className={styles.section}>
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordChange} className={styles.form}>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
          />
          <button type="submit" disabled={loading} className={styles.saveBtn}>
            {loading ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </section>

      {/* HESABI DURAKLAT & SİL */}
      <section className={styles.section}>
        <h3>Account Control</h3>
        <p className={styles.note}>
          You can temporarily pause your account or permanently delete it.
        </p>
        <div className={styles.actions}>
          <button onClick={() => setShowPauseModal(true)} className={styles.pauseBtn}>
            Pause Account
          </button>
          <button onClick={() => setShowDeleteModal(true)} className={styles.deleteBtn}>
            Delete Account
          </button>
        </div>
      </section>

      {role === 'student' && (
        <section className={styles.section}>
          <h3>Payment History</h3>
          <button onClick={goToPayments} className={styles.saveBtn}>
            View Payment History
          </button>
        </section>
      )}

      {/* --- MODALLAR --- */}
      {showPauseModal && (
        <div className={styles.modal}>
          <div className={styles.modalBox}>
            <h4>Pause Account?</h4>
            <p>
              Your account will be paused until you click the reactivation link
              sent to your email.
            </p>
            <div className={styles.modalActions}>
              <button onClick={handlePauseAccount} className={styles.confirmBtn}>Yes, Pause</button>
              <button onClick={() => setShowPauseModal(false)} className={styles.cancelBtn}>No</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className={styles.modal}>
          <div className={styles.modalBox}>
            <h4>Delete Account Permanently?</h4>
            <p>This action cannot be undone. You won’t be able to re-register with the same email.</p>
            <div className={styles.modalActions}>
              <button onClick={handleDeleteAccount} className={styles.deleteConfirm}>
                Yes, Delete
              </button>
              <button onClick={() => setShowDeleteModal(false)} className={styles.cancelBtn}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
