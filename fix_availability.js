const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixAvailability() {
  const teacherIds = ['IzECP1tFW227EUVhRTwP', '2yTcVWMuvZG6urokXUhp'];
  
  const availability = {
    'Monday': [{ start: '08:00', end: '22:00' }],
    'Tuesday': [{ start: '08:00', end: '22:00' }],
    'Wednesday': [{ start: '08:00', end: '22:00' }],
    'Thursday': [{ start: '08:00', end: '22:00' }],
    'Friday': [{ start: '08:00', end: '22:00' }],
    'Saturday': [{ start: '10:00', end: '18:00' }],
    'Sunday': [{ start: '10:00', end: '18:00' }]
  };

  for (const id of teacherIds) {
    await db.collection('users').doc(id).update({
      availability: availability,
      teachingLocations: ['Online', "Teacher's Home", "Student's Home"]
    });
    console.log(`Updated availability for teacher ID: ${id}`);
  }
}

fixAvailability().catch(console.error);
