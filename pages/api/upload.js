import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import path from 'path';
import Busboy from 'busboy';

const serviceAccount = JSON.parse(
  readFileSync(path.join(process.cwd(), 'serviceAccountKey.json'), 'utf8')
);

const BUCKET_NAME = 'bridgelang-3f27c.firebasestorage.app';
console.log('ENV Bucket:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
console.log('Apps:', getApps());

let app;
if (!getApps().length) {
  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: BUCKET_NAME,
  });
  console.log('✅ Firebase initialized with bucket:', BUCKET_NAME);
} else {
  app = getApp();
  console.log('ℹ️ Firebase already initialized.');
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
    const bucket = getStorage(app).bucket('bridgelang-3f27c.firebasestorage.app'); // 🔥 dikkat! `app` burada kesin initialize edilmiş!
    console.log('Bucket name being used:', bucket.name);

    const fileRef = bucket.file(`uploads/${Date.now()}-${filename}`);

    uploadPromise = new Promise((resolve, reject) => {
      file.pipe(fileRef.createWriteStream({ contentType: mimeType }))
        .on('error', reject)
        .on('finish', async () => {
          try {
            await fileRef.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;
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
