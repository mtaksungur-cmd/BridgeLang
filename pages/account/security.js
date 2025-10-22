'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../../lib/firebase';
import { updatePassword, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import styles from '../../scss/SecuritySettings.module.scss';

export default function SecuritySettings() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const router = useRouter();

  /* ---------- FETCH USER ROLE + NOTIFICATION PREF ---------- */
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setRole(data.role || '');
        setEmailNotifications(data.emailNotifications !== false);
      }
    };
    fetchUserData();
  }, []);

  /* ---------- TOGGLE EMAIL NOTIFICATIONS ---------- */
  const handleToggleNotifications = async () => {
    const user = auth.currentUser;
    if (!user) return setMessage('Please log in again.');

    const newValue = !emailNotifications;
    setEmailNotifications(newValue);
    setMessage(''); // reset

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        emailNotifications: newValue,
      });
      setMessage(
        newValue
          ? '✅ Email notifications enabled.'
          : '🔕 Email notifications disabled.'
      );
    } catch (err) {
      console.error('Failed to update emailNotifications:', err);
      setMessage('❌ Could not update notification setting.');
    }
  };

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
      const user = auth.currentUser;
      if (!user) return setMessage('Please log in again.');
      const idToken = await user.getIdToken();

      const res = await fetch('/api/account/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      try { await signOut(auth); } catch {}
      setShowPauseModal(false);
      router.push('/login');
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
      const user = auth.currentUser;
      if (!user) return setMessage('Please log in again.');

      const idToken = await user.getIdToken();

      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      try { await signOut(auth); } catch {}
      setShowDeleteModal(false);
      router.push('/');
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to delete account.');
    } finally {
      setLoading(false);
    }
  };

  const goToPayments = () => router.push('/student/payments');

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Account & Security</h2>

      {/* EMAIL NOTIFICATIONS TOGGLE */}
      <section className={styles.section}>
        <h3>Email Notifications</h3>
        <p className={styles.note}>
          Turning this off will disable lesson, reminder, and chat notifications.<br />
          You’ll still receive login and payment emails.
        </p>
        <div
          className={`${styles.toggleWrapper} ${
            emailNotifications ? styles.on : styles.off
          }`}
          onClick={handleToggleNotifications}
        >
          <div className={styles.toggleCircle}></div>
        </div>
        <p className={styles.toggleLabel}>
          {emailNotifications ? 'Enabled' : 'Disabled'}
        </p>
      </section>

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
          <button
            onClick={() => setShowPauseModal(true)}
            className={styles.pauseBtn}
          >
            Pause Account
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className={styles.deleteBtn}
          >
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
              <button onClick={handlePauseAccount} className={styles.confirmBtn}>
                Yes, Pause
              </button>
              <button
                onClick={() => setShowPauseModal(false)}
                className={styles.cancelBtn}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className={styles.modal}>
          <div className={styles.modalBox}>
            <h4>Delete Account Permanently?</h4>
            <p>
              This action cannot be undone. You won’t be able to re-register
              with the same email.
            </p>
            <div className={styles.modalActions}>
              <button
                onClick={handleDeleteAccount}
                className={styles.deleteConfirm}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className={styles.cancelBtn}
              >
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
