import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

function parseServiceAccountJson(rawValue) {
  if (!rawValue) return null;
  try {
    const normalized = rawValue.trim().replace(/^['"]|['"]$/g, '');
    return JSON.parse(normalized);
  } catch {
    return null;
  }
}

function initializeFirebase() {
  if (getApps().length > 0) {
    return getApp();
  }

  // 1. Try loading from JSON file first (local dev)
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

  // 2. Try plain JSON service account env (legacy/backward compatible)
  // Supports both FIREBASE_SERVICE_ACCOUNT_JSON and FIREBASE_SERVICE_ACCOUNT.
  const rawServiceAccountJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT;
  const parsedServiceAccountJson = parseServiceAccountJson(rawServiceAccountJson);
  if (parsedServiceAccountJson) {
    try {
      console.log('[FirebaseAdmin] Using JSON service account env for project:', parsedServiceAccountJson.project_id);
      return initializeApp({
        credential: cert(parsedServiceAccountJson),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (error) {
      console.error('[FirebaseAdmin] JSON Env Init Error:', error.message);
    }
  }

  // 3. Try base64-encoded full service account JSON (most reliable for Vercel)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(json);
      console.log('[FirebaseAdmin] Using base64 service account JSON for project:', serviceAccount.project_id);
      return initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (error) {
      console.error('[FirebaseAdmin] Base64 JSON Init Error:', error.message);
    }
  }

  // 4. Fallback to individual env vars
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;

  // If private key is provided as base64, decode it first.
  if (!privateKey && privateKeyBase64) {
    try {
      privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
    } catch (error) {
      console.error('[FirebaseAdmin] FIREBASE_PRIVATE_KEY_BASE64 decode error:', error.message);
    }
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
