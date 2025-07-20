import '../../lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';

export default async function handler(req, res) {
  try {
    await getAuth().listUsers(1); // sadece test
    return res.status(200).json({ success: true, message: '✅ Firebase Admin is working' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '❌ Firebase Admin not working', details: err.message });
  }
}
