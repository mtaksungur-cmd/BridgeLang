const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function checkAdmins() {
  const snapshot = await db.collection('users').where('role', '==', 'admin').get();
  if (snapshot.empty) {
      console.log('No admins found in DB.');
      // Find Tamer's account by email if possible
      const emailSnap = await db.collection('users').get();
      emailSnap.forEach(doc => {
          console.log(`User: ${doc.data().email}, Role: ${doc.data().role}`);
      });
  } else {
      snapshot.forEach(doc => {
          console.log(`Admin found: ${doc.data().email}, Name: ${doc.data().name}`);
      });
  }
}
checkAdmins();
