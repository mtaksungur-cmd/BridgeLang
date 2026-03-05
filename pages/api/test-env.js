// This endpoint is disabled in production.
// Remove the CRON_SECRET check or the entire file in a public deployment.
export default function handler(req, res) {
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return res.status(200).json({
    stripe_mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'LIVE' : 'TEST',
    firebase_project: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'unknown',
    base_url: process.env.NEXT_PUBLIC_BASE_URL || 'not set',
  });
}
