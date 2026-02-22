// tests/verify-db.mjs
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, '../firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function verify() {
  console.log('--- Database Verification ---');
  
  // 1. Check for any recent students
  const studentsSnapshot = await db.collection('users').where('role', '==', 'student').limit(5).get();
  console.log(`Found ${studentsSnapshot.size} student(s)`);
  studentsSnapshot.forEach(doc => {
    console.log(`Student: ${doc.id}, Email: ${doc.data().email}`);
  });

  // 2. Check for intro lessons
  const introLessons = await db.collection('bookings').where('isIntro', '==', true).limit(5).get();
  console.log(`Found ${introLessons.size} intro lesson(s)`);

  // 3. Check for recent reviews
  const reviews = await db.collection('reviews').limit(5).get();
  console.log(`Found ${reviews.size} review(s)`);

  process.exit(0);
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
