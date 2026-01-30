// pages/api/upload.js
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import Busboy from 'busboy';
import { v4 as uuidv4 } from 'uuid';

let app;
if (!getApps().length) {
  const privateKey = Buffer.from(
    process.env.FIREBASE_PRIVATE_KEY_BASE64,
    'base64'
  ).toString('utf-8');

  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
} else {
  app = getApp();
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const busboy = Busboy({ headers: req.headers });
  let uploadPromise;

  busboy.on('file', (fieldname, file, { filename, mimeType }) => {
    const safeName = filename
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.\-_]/g, "_");

    const bucket = getStorage(app).bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const fileRef = bucket.file(`uploads/${Date.now()}-${safeName}`);
    const uuid = uuidv4();

    uploadPromise = new Promise((resolve, reject) => {
      file.pipe(
        fileRef.createWriteStream({
          contentType: mimeType,
          metadata: {
            metadata: {
              firebaseStorageDownloadTokens: uuid, // ✅ manuel token ekle
            },
          },
        })
      )
        .on('error', reject)
        .on('finish', async () => {
          try {
            const publicUrl =
              `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${uuid}`;
            resolve(publicUrl);
          } catch (err) {
            reject(err);
          }
        });
    });
  });

  busboy.on('finish', async () => {
    try {
      if (!uploadPromise) throw new Error('No file uploaded.');
      const url = await uploadPromise;
      res.status(200).json({ url });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  req.pipe(busboy);
}
