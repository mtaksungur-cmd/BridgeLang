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
  const [introConsentProfile, setIntroConsentProfile] = useState(false);
  const [introConsentSocial, setIntroConsentSocial] = useState(false);
  const [hasIntroVideo, setHasIntroVideo] = useState(false);

  const router = useRouter();

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
        setHasIntroVideo(!!data.intro_video_path || !!data.introVideoUrl);
      }
    };
    fetchUserData();
  }, []);

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
        consentKey: key === 'intro_video_consent_profile' ? 'profile' : 'social',
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
      try { await signOut(auth); } catch { }
      setShowPauseModal(false);
      router.push('/login');
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to pause account.');
    } finally {
      setLoading(false);
    }
  };

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

      try { await signOut(auth); } catch { }
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
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Account & Security</h1>

        {message && <div className={styles.alert}>{message}</div>}

        <div className={styles.grid}>
          {/* LEFT COLUMN - Security */}
          <div className={styles.column}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Change Password</h2>
              <form onSubmit={handlePasswordChange} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <button type="submit" disabled={loading} className={styles.btnPrimary}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            {role === 'teacher' && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Intro Video Visibility</h2>
                <p className={styles.cardDesc}>
                  Manage who can see and use your introduction video. These settings only apply if you have an intro video uploaded.
                </p>

                <div className={styles.toggleBlock}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <div className={styles.toggleLabel}>Show on my public tutor profile</div>
                      <div className={styles.toggleDesc}>
                        Enables your intro video to be shown directly on your BridgeLang tutor profile.
                      </div>
                    </div>
                    <div
                      className={`${styles.toggle} ${introConsentProfile ? styles.toggleOn : styles.toggleOff}`}
                      onClick={() =>
                        hasIntroVideo &&
                        handleIntroConsentChange('intro_video_consent_profile', !introConsentProfile)
                      }
                      style={{ opacity: hasIntroVideo ? 1 : 0.5, cursor: hasIntroVideo ? 'pointer' : 'not-allowed' }}
                    >
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.toggleBlock}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <div className={styles.toggleLabel}>Allow use in BridgeLang promotional content</div>
                      <div className={styles.toggleDesc}>
                        Allows BridgeLang to use your intro video in ads, social media, and marketing material.
                      </div>
                    </div>
                    <div
                      className={`${styles.toggle} ${introConsentSocial ? styles.toggleOn : styles.toggleOff}`}
                      onClick={() =>
                        hasIntroVideo &&
                        handleIntroConsentChange('intro_video_consent_social', !introConsentSocial)
                      }
                      style={{ opacity: hasIntroVideo ? 1 : 0.5, cursor: hasIntroVideo ? 'pointer' : 'not-allowed' }}
                    >
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                {!hasIntroVideo && (
                  <p className={styles.muted}>
                    You don't have an intro video yet. You can upload one from your Teacher Dashboard.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Preferences & Actions */}
          <div className={styles.column}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Email Notifications</h2>
              <p className={styles.cardDesc}>
                Turning this off will disable lesson, reminder, and chat notifications. You'll still receive login and payment emails.
              </p>
              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <div className={styles.toggleLabel}>
                    {emailNotifications ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                <div
                  className={`${styles.toggle} ${emailNotifications ? styles.toggleOn : styles.toggleOff}`}
                  onClick={handleToggleNotifications}
                >
                  <div className={styles.toggleKnob}></div>
                </div>
              </div>
            </div>

            {role === 'student' && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Payment History</h2>
                <p className={styles.cardDesc}>
                  View your complete payment history and transaction details.
                </p>
                <button onClick={goToPayments} className={styles.btnSecondary}>
                  View Payment History
                </button>
              </div>
            )}

            <div className={styles.dangerZone}>
              <h2 className={styles.dangerTitle}>Danger Zone</h2>
              <p className={styles.dangerDesc}>
                You can temporarily pause your account or permanently delete it.
              </p>
              <div className={styles.dangerActions}>
                <button onClick={() => setShowPauseModal(true)} className={styles.btnWarning}>
                  Pause Account
                </button>
                <button onClick={() => setShowDeleteModal(true)} className={styles.btnDanger}>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPauseModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPauseModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Pause Account?</h3>
            <p className={styles.modalText}>
              Your account will be paused until you click the reactivation link sent to your email.
            </p>
            <div className={styles.modalActions}>
              <button onClick={handlePauseAccount} className={styles.btnWarning} disabled={loading}>
                {loading ? 'Pausing...' : 'Yes, Pause'}
              </button>
              <button onClick={() => setShowPauseModal(false)} className={styles.btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Delete Account Permanently?</h3>
            <p className={styles.modalText}>
              This action cannot be undone. You won't be able to re-register with the same email.
            </p>
            <div className={styles.modalActions}>
              <button onClick={handleDeleteAccount} className={styles.btnDanger} disabled={loading}>
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button onClick={() => setShowDeleteModal(false)} className={styles.btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
