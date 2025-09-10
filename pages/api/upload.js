// pages/api/upload.js
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import Busboy from 'busboy';

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
    const bucket = getStorage(app).bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const fileRef = bucket.file(`uploads/${Date.now()}-${filename}`);

    uploadPromise = new Promise((resolve, reject) => {
      file.pipe(fileRef.createWriteStream({ contentType: mimeType }))
        .on('error', reject)
        .on('finish', () => resolve(fileRef));
    });
  });

  busboy.on('finish', async () => {
    try {
      if (!uploadPromise) throw new Error('No file uploaded.');
      const fileRef = await uploadPromise;

      // ✅ Signed URL al
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '03-01-2500',
      });

      res.status(200).json({ url });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  req.pipe(busboy);
}
