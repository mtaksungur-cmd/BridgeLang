// pages/api/parent-confirm.js
import { adminDb } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  const { token, sid } = req.query;
  if (!token || !sid) return res.status(400).send('Invalid request');

  const ref = adminDb.collection('parentConsents').doc(sid);
  const snap = await ref.get();
  if (!snap.exists) return res.status(400).send('Invalid or expired token');

  const data = snap.data();
  if (data.token !== token || Date.now() > data.expireAt) {
    return res.status(400).send('Token expired or invalid');
  }

  await ref.update({
    confirmed: true,
    confirmedAt: Date.now(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    ua: req.headers['user-agent'] || '',
  });

  await adminDb.collection('users').doc(sid).update({
    parentConsent: {
      confirmedAt: Date.now(),
    },
  });

  res.send('<h2>✅ Consent confirmed. Your child can now use BridgeLang.</h2>');
}
