import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import path from 'path';
import Busboy from 'busboy';

// ✅ Doğru JSON'dan servis hesabını oku
const serviceAccount = JSON.parse(
  readFileSync(path.join(process.cwd(), 'serviceAccountKey.json'), 'utf8')
);

// ✅ Sadece bir kere initialize
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'bridgelang-3f27c.firebasestorage.app', // 🔧 düzeltildi
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const busboy = Busboy({ headers: req.headers });
  let uploadPromise;

  busboy.on('file', (fieldname, file, { filename, mimeType }) => {
    const bucket = getStorage().bucket();
    const fileRef = bucket.file(`uploads/${Date.now()}-${filename}`);

    uploadPromise = new Promise((resolve, reject) => {
      file.pipe(fileRef.createWriteStream({ contentType: mimeType }))
        .on('error', reject)
        .on('finish', async () => {
          await fileRef.makePublic();
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;
          resolve(publicUrl);
        });
    });
  });

  busboy.on('finish', async () => {
    try {
      const url = await uploadPromise;
      res.status(200).json({ url });
    } catch (err) {
      console.error('Upload failed:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  req.pipe(busboy);
}
