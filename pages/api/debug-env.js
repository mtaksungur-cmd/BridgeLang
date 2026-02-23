// TEMPORARY - DELETE AFTER DEBUGGING
export default async function handler(req, res) {
  const results = {};

  // Check FIREBASE_SERVICE_ACCOUNT_BASE64
  const saBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  results.hasServiceAccountBase64 = !!saBase64;
  results.saBase64Length = saBase64?.length || 0;

  if (saBase64) {
    try {
      const decoded = Buffer.from(saBase64, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      results.saDecoded = true;
      results.saHasProjectId = !!parsed.project_id;
      results.saHasClientEmail = !!parsed.client_email;
      results.saHasPrivateKey = !!parsed.private_key;
      results.saProjectId = parsed.project_id;

      // Try cert
      const { cert } = await import('firebase-admin/app');
      try {
        const cred = cert(parsed);
        results.certSuccess = true;
      } catch (e) {
        results.certSuccess = false;
        results.certError = e.message;
      }
    } catch (e) {
      results.saDecoded = false;
      results.saDecodeError = e.message;
    }
  }

  // Check existing adminDb
  try {
    const { adminDb } = await import('../../lib/firebaseAdmin');
    results.adminDbExists = !!adminDb;
    if (adminDb) {
      results.firestoreTest = 'connected';
    }
  } catch (e) {
    results.adminDbError = e.message;
  }

  res.status(200).json(results);
}
