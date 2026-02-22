const { adminDb } = require('./lib/firebaseAdmin');
async function check() {
  const doc = await adminDb.collection('users').doc('HPrWbGnREGM1I7B7FwHHLui2ZSI2').get();
  console.log(JSON.stringify(doc.data(), null, 2));
}
check();
