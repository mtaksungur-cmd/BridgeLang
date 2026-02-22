const admin = require('/root/.openclaw/workspace/bridgelang_temp/node_modules/firebase-admin');
const serviceAccount = require('/root/.openclaw/workspace/bridgelang_temp/firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function check() {
  const doc = await db.collection('users').doc('IzECP1tFW227EUVhRTwP').get();
  const data = doc.data();
  console.log('Teacher Name:', data.name);
  console.log('Availability Keys:', Object.keys(data.availability || {}));
  console.log('Wednesday Slots:', data.availability?.Wednesday);
}

check().catch(console.error);
