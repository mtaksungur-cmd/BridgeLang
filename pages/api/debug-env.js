// TEMPORARY - DELETE AFTER DEBUGGING
export default async function handler(req, res) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
  
  // Apply same cleaning as firebaseAdmin.js
  let cleaned = privateKey;
  // Remove wrapping quotes
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  // Replace escaped newlines with real ones
  cleaned = cleaned.replace(/\\n/g, '\n');
  // Collapse any double newlines from mixed formats
  cleaned = cleaned.replace(/\n\n/g, '\n');

  let initResult = 'not attempted';
  let initError = null;
  
  try {
    const { adminDb } = await import('../../lib/firebaseAdmin');
    initResult = adminDb ? 'SUCCESS' : 'FAILED (adminDb is null)';
  } catch (err) {
    initResult = 'EXCEPTION';
    initError = err.message;
  }

  res.status(200).json({
    initResult,
    initError,
    envCheck: {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!privateKey,
      privateKeyLength: privateKey.length,
      cleanedKeyLength: cleaned.length,
      cleanedHasBegin: cleaned.includes('-----BEGIN PRIVATE KEY-----'),
      cleanedHasEnd: cleaned.includes('-----END PRIVATE KEY-----'),
      cleanedNewlineCount: (cleaned.match(/\n/g) || []).length,
      cleanedHasEscapedNewlines: cleaned.includes('\\n'),
    },
  });
}
