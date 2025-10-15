'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import styles from '../../scss/SecuritySettings.module.scss';

export default function SecuritySettings() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Firestore'dan mevcut 2FA durumu çek
  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const d = snap.data();
        setMfaEnabled(!!d.mfaEnabled);
      }
    };
    fetchUser();
  }, []);

  // Şifre değiştirme
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

  // 2FA aktif/pasif
  const toggleMfa = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        mfaEnabled: !mfaEnabled,
      });
      setMfaEnabled(!mfaEnabled);
      setMessage(
        !mfaEnabled
          ? '🔐 Two-Step Verification enabled.'
          : '⚙️ Two-Step Verification disabled.'
      );
    } catch (err) {
      console.error(err);
      setMessage('❌ Could not update 2FA status.');
    }
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Security Settings</h2>

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
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
          />
          <button type="submit" disabled={loading} className={styles.saveBtn}>
            {loading ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <h3>Two-Step Verification (2FA)</h3>
        <p className={styles.note}>
          Add an extra layer of protection to your account.
        </p>
        <button
          onClick={toggleMfa}
          className={`${styles.toggleBtn} ${
            mfaEnabled ? styles.disable : styles.enable
          }`}
        >
          {mfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
        </button>
      </section>

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
