// TEMPORARY DEBUG - DELETE AFTER FIXING
export default function handler(req, res) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  res.status(200).json({
    hasProjectId: !!projectId,
    projectId: projectId || 'MISSING',
    hasClientEmail: !!clientEmail,
    clientEmail: clientEmail ? clientEmail.substring(0, 15) + '...' : 'MISSING',
    hasPrivateKey: !!privateKey,
    privateKeyStart: privateKey ? privateKey.substring(0, 40) + '...' : 'MISSING',
    privateKeyLength: privateKey ? privateKey.length : 0,
    privateKeyHasBegin: privateKey ? privateKey.includes('-----BEGIN') : false,
    privateKeyHasRealNewlines: privateKey ? privateKey.includes('\n') : false,
    privateKeyHasEscapedNewlines: privateKey ? privateKey.includes('\\n') : false,
    hasStripeKey: !!stripeKey,
    stripeKeyStart: stripeKey ? stripeKey.substring(0, 12) + '...' : 'MISSING',
    nodeEnv: process.env.NODE_ENV,
    vercelUrl: process.env.VERCEL_URL || 'NOT SET',
  });
}
