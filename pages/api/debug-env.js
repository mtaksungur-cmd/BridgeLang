// TEMPORARY DEBUG - DELETE AFTER FIXING
import { cert } from 'firebase-admin/app';
import { adminDb } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Clean key same way as firebaseAdmin.js
  if (privateKey) {
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // Try cert() directly to see the real error
  let certError = null;
  let certSuccess = false;
  try {
    const credential = cert({ projectId, clientEmail, privateKey });
    certSuccess = true;
  } catch (e) {
    certError = e.message;
  }

  // Try a Firestore operation if adminDb exists
  let firestoreTest = null;
  if (adminDb) {
    try {
      const testDoc = await adminDb.collection('_debug').doc('test').get();
      firestoreTest = 'OK';
    } catch (e) {
      firestoreTest = e.message;
    }
  }

  res.status(200).json({
    adminDbExists: !!adminDb,
    certSuccess,
    certError,
    firestoreTest,
    envCheck: {
      projectId: projectId || 'MISSING',
      clientEmail: clientEmail ? clientEmail.substring(0, 20) + '...' : 'MISSING',
      privateKeyFirst50: privateKey ? privateKey.substring(0, 50) : 'MISSING',
      privateKeyLast30: privateKey ? privateKey.substring(privateKey.length - 30) : 'MISSING',
      privateKeyLength: privateKey?.length || 0,
      newlineCount: (privateKey?.match(/\n/g) || []).length,
    },
  });
}
