const admin = require('/root/.openclaw/workspace/bridgelang_temp/node_modules/firebase-admin');
const serviceAccount = require('/root/.openclaw/workspace/bridgelang_temp/firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixAvailability() {
  const teacherIds = ['IzECP1tFW227EUVhRTwP', '2yTcVWMuvZG6urokXUhp'];
  
  // Extend availability to 23:45 to ensure slots show up late at night
  const availability = {
    'Monday': [{ start: '00:00', end: '23:59' }],
    'Tuesday': [{ start: '00:00', end: '23:59' }],
    'Wednesday': [{ start: '00:00', end: '23:59' }],
    'Thursday': [{ start: '00:00', end: '23:59' }],
    'Friday': [{ start: '00:00', end: '23:59' }],
    'Saturday': [{ start: '00:00', end: '23:59' }],
    'Sunday': [{ start: '00:00', end: '23:59' }]
  };

  for (const id of teacherIds) {
    await db.collection('users').doc(id).update({
      availability: availability
    });
    console.log(`Updated availability (Full Day) for teacher ID: ${id}`);
  }
}

fixAvailability().catch(console.error);
