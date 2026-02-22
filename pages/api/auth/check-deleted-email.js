import { adminDb } from '../../../lib/firebaseAdmin';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  // If Firebase Admin failed to initialize, assume email is not deleted
  if (!adminDb) {
    console.warn('check-deleted-email: adminDb is null, Firebase Admin not initialized');
    return res.json({ deleted: false });
  }

  try {
    const emailHash = crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
    const doc = await adminDb.collection('deletedEmails').doc(emailHash).get();

    return res.json({ deleted: doc.exists });
  } catch (err) {
    console.error('check-deleted-email error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
