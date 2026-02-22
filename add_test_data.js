const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function addTestTeachers() {
  const teachers = [
    {
      name: 'James Parker',
      email: 'james@example.com',
      role: 'teacher',
      approved: true,
      country: 'England',
      city: 'London',
      pricing30: 15,
      pricing60: 25,
      specialties: ['Business English', 'IELTS Preparation'],
      bio: 'Friendly, experienced tutor helping students achieve their English goals.',
      rating: 4.8,
      reviewCount: 108,
      status: 'active',
      createdAt: new Date()
    },
    {
      name: 'Amelia Roberts',
      email: 'amelia@example.com',
      role: 'teacher',
      approved: true,
      country: 'Scotland',
      city: 'Edinburgh',
      pricing30: 18,
      pricing60: 30,
      specialties: ['Conversational English', 'Grammar'],
      bio: 'Native teacher focused on building student confidence.',
      rating: 4.9,
      reviewCount: 67,
      status: 'active',
      createdAt: new Date()
    }
  ];

  for (const t of teachers) {
    const ref = db.collection('users').doc();
    await ref.set(t);
    console.log(`Added teacher: ${t.name} with ID: ${ref.id}`);
    
    // Add some dummy availability for today and tomorrow
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const slots = [
        { startTime: '10:00', endTime: '11:00', status: 'available' },
        { startTime: '11:00', endTime: '12:00', status: 'available' },
        { startTime: '14:00', endTime: '15:00', status: 'available' },
        { startTime: '15:00', endTime: '16:00', status: 'available' },
        { startTime: '20:00', endTime: '21:00', status: 'available' },
        { startTime: '21:00', endTime: '22:00', status: 'available' },
        { startTime: '22:00', endTime: '23:00', status: 'available' }
    ];

    await db.collection('availability').doc(`${ref.id}_${dateStr}`).set({
        teacherId: ref.id,
        date: dateStr,
        slots: slots
    });
    
    await db.collection('availability').doc(`${ref.id}_${tomorrowStr}`).set({
        teacherId: ref.id,
        date: tomorrowStr,
        slots: slots
    });
  }
  console.log('✅ Test teachers and availability added.');
}

addTestTeachers().catch(console.error);
