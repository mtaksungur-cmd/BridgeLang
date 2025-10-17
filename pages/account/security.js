'use client';
import { useState, useEffect } from 'react';
import {
  auth,
  db
} from '../../lib/firebase';
import {
  updatePassword,
  RecaptchaVerifier,
  PhoneAuthProvider,
  multiFactor,
  PhoneMultiFactorGenerator
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import styles from '../../scss/SecuritySettings.module.scss';

export default function SecuritySettings() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setMfaEnabled(!!snap.data().mfaEnabled);
    };
    fetchUser();
  }, []);

  /* ---------- PASSWORD CHANGE ---------- */
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

  /* ---------- START 2FA ENROLL ---------- */
  const startVerification = async () => {
    try {
      setMessage('');
      const user = auth.currentUser;
      const session = await multiFactor(user).getSession();

      const recaptcha = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible'
      }, auth);

      const phoneOptions = {
        phoneNumber: phone,
        session
      };

      const provider = new PhoneAuthProvider(auth);
      const id = await provider.verifyPhoneNumber(phoneOptions, recaptcha);
      setVerificationId(id);
      setMessage('📲 Verification code sent to ' + phone);
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to send code. Check the phone number.');
    }
  };

  /* ---------- VERIFY SMS CODE ---------- */
  const confirmCode = async () => {
    try {
      const cred = PhoneAuthProvider.credential(verificationId, code);
      await multiFactor(auth.currentUser).enroll(
        cred,
        'My phone'
      );

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        mfaEnabled: true,
      });

      setMfaEnabled(true);
      setMessage('✅ Two-Step Verification enabled successfully.');
      setPhone('');
      setCode('');
      setVerificationId('');
    } catch (err) {
      console.error(err);
      setMessage('❌ Verification failed.');
    }
  };

  /* ---------- DISABLE 2FA ---------- */
  const disableMfa = async () => {
    try {
      // Firebase'te enrolled faktörleri kaldırma doğrudan SDK'da yok;
      // kullanıcı manuel olarak "Remove factor" panelinden kaldırabilir.
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        mfaEnabled: false,
      });
      setMfaEnabled(false);
      setMessage('⚙️ Two-Step Verification disabled.');
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to disable 2FA.');
    }
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Security Settings</h2>

      {/* ---------- PASSWORD SECTION ---------- */}
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

      {/* ---------- 2FA SECTION ---------- */}
      <section className={styles.section}>
        <h3>Two-Step Verification (SMS-based)</h3>
        {!mfaEnabled ? (
          <>
            <input
              type="tel"
              placeholder="+44 7700 900123"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={styles.input}
            />
            <div id="recaptcha-container"></div>

            {!verificationId ? (
              <button
                onClick={startVerification}
                className={styles.saveBtn}
                disabled={!phone}
              >
                Send Verification Code
              </button>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter SMS Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={styles.input}
                />
                <button
                  onClick={confirmCode}
                  className={styles.saveBtn}
                  disabled={!code}
                >
                  Confirm & Enable 2FA
                </button>
              </>
            )}
          </>
        ) : (
          <button onClick={disableMfa} className={styles.toggleBtn}>
            Disable 2FA
          </button>
        )}
      </section>

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
