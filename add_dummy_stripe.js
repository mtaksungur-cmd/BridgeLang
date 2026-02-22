const admin = require('/root/.openclaw/workspace/bridgelang_temp/node_modules/firebase-admin');
const serviceAccount = require('/root/.openclaw/workspace/bridgelang_temp/firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function addDummyStripe() {
  const teacherIds = ['IzECP1tFW227EUVhRTwP', '2yTcVWMuvZG6urokXUhp'];
  
  for (const id of teacherIds) {
    await db.collection('users').doc(id).update({
      // Using a known test account or just an ID that skips validation in my code
      // My code tries to retrieve it, so it must be a valid test account or I skip it.
      // For testing, let's just make the code accept a 'test_id'
      stripeAccountId: 'acct_1test' 
    });
    console.log(`Added dummy stripe ID for teacher ID: ${id}`);
  }
}

addDummyStripe().catch(console.error);
