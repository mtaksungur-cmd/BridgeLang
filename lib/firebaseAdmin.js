import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

function initializeFirebase() {
  if (getApps().length > 0) {
    return getApp();
  }

  // 1. Try loading from JSON file first (most reliable)
  const jsonPath = path.resolve(process.cwd(), 'firebase-service-account.json');
  if (fs.existsSync(jsonPath)) {
    console.log('[FirebaseAdmin] Loading from JSON file:', jsonPath);
    try {
      return initializeApp({
        credential: cert(jsonPath),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (error) {
      console.error('[FirebaseAdmin] JSON Load Error:', error.message);
    }
  }

  // 2. Fallback to Environment Variables
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = null;

  // Priority 1: Base64-encoded key (most reliable for Vercel)
  if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
    try {
      privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf-8');
      console.log('[FirebaseAdmin] Using base64-decoded private key');
    } catch (e) {
      console.error('[FirebaseAdmin] Base64 decode failed:', e.message);
    }
  }

  // Priority 2: Plain text key
  if (!privateKey) {
    privateKey = process.env.FIREBASE_PRIVATE_KEY;
  }

  if (!privateKey) {
    console.error('[FirebaseAdmin] Private Key is missing!');
    return null;
  }

  // Remove wrapping quotes if any
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.substring(1, privateKey.length - 1);
  }

  // Normalize: escaped \n → real newline, collapse doubles
  privateKey = privateKey.replace(/\\n/g, '\n');
  privateKey = privateKey.replace(/\n{2,}/g, '\n');
  privateKey = privateKey.trim();

  console.log('[FirebaseAdmin] Initializing with Env Vars:', projectId);

  try {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error('[FirebaseAdmin] Env Init Error:', error.message);
    return null;
  }
}

const app = initializeFirebase();

export const adminDb = app ? getFirestore(app) : null;
export const adminAuth = app ? getAuth(app) : null;
export const adminStorage = app ? getStorage(app) : null;
export { FieldValue } from 'firebase-admin/firestore';
