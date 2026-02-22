const { adminDb } = require('./lib/firebaseAdmin');

async function checkUser(uid) {
  const doc = await adminDb.collection('users').doc(uid).get();
  if (doc.exists) {
    const d = doc.data();
    console.log(`User: ${d.email} | Plan: ${d.subscriptionPlan} | views: ${d.viewLimit} | msgs: ${d.messagesLeft}`);
  } else {
    console.log("User not found");
  }
}

const uid = process.argv[2] || 'HPrWbGnREGM1I7B7FwHHLui2ZSI2';
checkUser(uid);
