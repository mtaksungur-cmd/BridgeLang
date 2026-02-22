const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function checkSettings() {
  const doc = await db.collection('platformSettings').doc('auth').get();
  console.log('Auth Settings:', JSON.stringify(doc.data(), null, 2));
}
checkSettings();
