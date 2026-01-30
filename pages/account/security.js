// pages/account/security.js  (veya mevcut SecuritySettings sayfan)
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../../lib/firebase';
import { updatePassword, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
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

  // intro video consent state
  const [introConsentProfile, setIntroConsentProfile] = useState(false);
  const [introConsentSocial, setIntroConsentSocial] = useState(false);
  const [hasIntroVideo, setHasIntroVideo] = useState(false);

  const router = useRouter();

  /* ---------- FETCH USER ROLE + NOTIFICATION PREF + INTRO CONSENTS ---------- */
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setRole(data.role || '');
        setEmailNotifications(data.emailNotifications !== false);

        setIntroConsentProfile(!!data.intro_video_consent_profile);
        setIntroConsentSocial(!!data.intro_video_consent_social);
        setHasIntroVideo(
          !!data.intro_video_path || !!data.introVideoUrl
        );
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
    setMessage('');

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

  /* ---------- INTRO VIDEO CONSENT CHANGE ---------- */
  const handleIntroConsentChange = async (key, newValue) => {
    const user = auth.currentUser;
    if (!user) return setMessage('Please log in again.');
    if (!hasIntroVideo) {
      return setMessage('You need an intro video before changing these settings.');
    }

    setMessage('');
    setLoading(true);

    try {
      const historyEntry = {
        type: 'consent_change',
        consentKey:
          key === 'intro_video_consent_profile' ? 'profile' : 'social',
        newValue,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'users', user.uid), {
        [key]: newValue,
        intro_video_last_update: new Date().toISOString(),
        intro_video_history: arrayUnion(historyEntry),
      });

      if (key === 'intro_video_consent_profile') {
        setIntroConsentProfile(newValue);
      } else {
        setIntroConsentSocial(newValue);
      }

      setMessage('✅ Intro video visibility updated.');
    } catch (err) {
      console.error('Intro consent update error:', err);
      setMessage('❌ Could not update intro video visibility.');
    } finally {
      setLoading(false);
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

      {/* INTRO VIDEO VISIBILITY (Teacher only) */}
      {role === "teacher" && (
        <section className={styles.section}>
          <h3>Intro Video Visibility</h3>
          <p className={styles.note}>
            Manage who can see and use your introduction video.  
            These settings only apply if you have an intro video uploaded.
          </p>

          {/* PROFILE CONSENT TOGGLE */}
          <div className={styles.toggleBlock}>
            <div className={styles.toggleHeader}>
              <span className={styles.toggleTitle}>
                Show on my public tutor profile
              </span>
              <div
                className={`${styles.toggleWrapper} ${
                  introConsentProfile ? styles.on : styles.off
                }`}
                onClick={() =>
                  hasIntroVideo &&
                  handleIntroConsentChange(
                    "intro_video_consent_profile",
                    !introConsentProfile
                  )
                }
                style={{ opacity: hasIntroVideo ? 1 : 0.5, cursor: hasIntroVideo ? "pointer" : "not-allowed" }}
              >
                <div className={styles.toggleCircle}></div>
              </div>
            </div>
            <p className={styles.toggleDescription}>
              Enables your intro video to be shown directly on your BridgeLang tutor profile.
            </p>
            <p className={styles.toggleHint}>
              You can turn this off at any time. Your intro video will immediately be removed from your public profile.
            </p>
          </div>

          {/* SOCIAL CONSENT TOGGLE */}
          <div className={styles.toggleBlock}>
            <div className={styles.toggleHeader}>
              <span className={styles.toggleTitle}>
                Allow use in BridgeLang social media & promotional content
              </span>
              <div
                className={`${styles.toggleWrapper} ${
                  introConsentSocial ? styles.on : styles.off
                }`}
                onClick={() =>
                  hasIntroVideo &&
                  handleIntroConsentChange(
                    "intro_video_consent_social",
                    !introConsentSocial
                  )
                }
                style={{ opacity: hasIntroVideo ? 1 : 0.5, cursor: hasIntroVideo ? "pointer" : "not-allowed" }}
              >
                <div className={styles.toggleCircle}></div>
              </div>
            </div>
            <p className={styles.toggleDescription}>
              Allows BridgeLang to use your intro video in ads, social media, and marketing material.
            </p>
            <p className={styles.toggleHint}>
              You can withdraw this permission at any time. Your video will no longer be used in BridgeLang’s social media or promotional content.
            </p>
          </div>

          {!hasIntroVideo && (
            <p className={styles.muted}>
              You don&apos;t have an intro video yet. You can upload one from your Teacher Dashboard.
            </p>
          )}
        </section>
      )}

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
