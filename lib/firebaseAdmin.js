import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

if (!getApps().length) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY_BASE64;

  try {
    const decoded = Buffer.from(privateKey, 'base64').toString('utf-8');
    if (decoded.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = decoded;
    }
  } catch (e) {
  }

  if (privateKey && typeof privateKey === 'string') {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (privateKey && !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    if (privateKey.trim().startsWith('MII')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`; // firebase key yapısı dokunmayınız
    }
  }

  if (!privateKey) {
    console.error('Firebase Private Key is missing or invalid in .env');
  }

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
export const adminStorage = getStorage();
