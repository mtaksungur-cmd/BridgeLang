// TEMPORARY - DELETE AFTER DEBUGGING
export default async function handler(req, res) {
  // Try to actually initialize Firebase Admin and report the error
  try {
    const { adminDb } = await import('../../lib/firebaseAdmin');
    
    if (!adminDb) {
      return res.status(200).json({
        status: 'FAILED',
        message: 'adminDb is null - Firebase Admin failed to initialize',
        envCheck: {
          hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
          hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
          privateKeyLength: (process.env.FIREBASE_PRIVATE_KEY || '').length,
          privateKeyHasBegin: (process.env.FIREBASE_PRIVATE_KEY || '').includes('-----BEGIN'),
          privateKeyHasEnd: (process.env.FIREBASE_PRIVATE_KEY || '').includes('-----END'),
          privateKeyHasRealNewlines: (process.env.FIREBASE_PRIVATE_KEY || '').includes('\n'),
          privateKeyHasEscapedNewlines: (process.env.FIREBASE_PRIVATE_KEY || '').includes('\\n'),
        }
      });
    }

    // Try a simple Firestore operation
    const testRef = adminDb.collection('users').limit(1);
    const snap = await testRef.get();
    
    return res.status(200).json({
      status: 'OK',
      message: 'Firebase Admin initialized successfully',
      firestoreWorks: true,
      docCount: snap.size,
    });
  } catch (err) {
    return res.status(200).json({
      status: 'ERROR',
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 5),
    });
  }
}
