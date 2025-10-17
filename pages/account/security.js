// pages/account/security.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../../lib/firebase';
import { updatePassword, deleteUser } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import styles from '../../scss/SecuritySettings.module.scss';

export default function SecuritySettings() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Kullanıcı rolünü çek
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
      const user = auth.currentUser;
      if (!user) return setMessage('Please log in again.');
      await updateDoc(doc(db, 'users', user.uid), { status: 'paused' });
      setMessage('⚙️ Your account has been paused. You can re-activate anytime.');
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to pause account.');
    }
  };

  /* ---------- HESABI KALICI SİL ---------- */
  const handleDeleteAccount = async () => {
    if (!confirm('⚠️ This will permanently delete your account. Continue?')) return;
    try {
      const user = auth.currentUser;
      if (!user) return setMessage('Please log in again.');
      await updateDoc(doc(db, 'users', user.uid), { status: 'deleted', deletedAt: Date.now() });
      await deleteUser(user);
      setMessage('🗑️ Your account has been permanently deleted.');
      router.push('/');
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to delete account.');
    }
  };

  /* ---------- ÖDEME GEÇMİŞİ (SADECE STUDENT) ---------- */
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

      {/* HESABI DURAKLAT */}
      <section className={styles.section}>
        <h3>Account Control</h3>
        <p className={styles.note}>
          You can temporarily pause your account or permanently delete it.
        </p>
        <div className={styles.actions}>
          <button onClick={handlePauseAccount} className={styles.pauseBtn}>
            Pause Account
          </button>
          <button onClick={handleDeleteAccount} className={styles.deleteBtn}>
            Delete Account
          </button>
        </div>
      </section>

      {/* ÖDEME GEÇMİŞİ (SADECE ÖĞRENCİ) */}
      {role === 'student' && (
        <section className={styles.section}>
          <h3>Payment History</h3>
          <p className={styles.note}>
            View your past subscriptions and payments.
          </p>
          <button onClick={goToPayments} className={styles.saveBtn}>
            View Payment History
          </button>
        </section>
      )}

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
