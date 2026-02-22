const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function enableOtp() {
  await db.collection('platformSettings').doc('auth').set({
    otpEnabled: true,
    updatedAt: new Date().toISOString()
  }, { merge: true });
  console.log('✅ OTP (Login Verification) enabled globally.');
}
enableOtp();
