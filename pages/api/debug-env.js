// TEMPORARY - DELETE AFTER DEBUGGING
export default async function handler(req, res) {
  const result = {
    hasBase64Key: !!process.env.FIREBASE_PRIVATE_KEY_BASE64,
    base64KeyLength: process.env.FIREBASE_PRIVATE_KEY_BASE64?.length || 0,
    hasRegularKey: !!process.env.FIREBASE_PRIVATE_KEY,
    regularKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
  };

  // Try base64 decode
  if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf-8');
      result.base64DecodedLength = decoded.length;
      result.base64DecodedHasBegin = decoded.includes('-----BEGIN PRIVATE KEY-----');
      result.base64DecodedHasEnd = decoded.includes('-----END PRIVATE KEY-----');
      result.base64DecodedNewlines = (decoded.match(/\n/g) || []).length;

      // Try cert with decoded key
      const { cert } = await import('firebase-admin/app');
      try {
        cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: decoded,
        });
        result.base64CertResult = 'SUCCESS';
      } catch (e) {
        result.base64CertResult = 'FAILED: ' + e.message;
      }
    } catch (e) {
      result.base64DecodeError = e.message;
    }
  }

  // Try regular key with cleanup
  if (process.env.FIREBASE_PRIVATE_KEY) {
    let pk = process.env.FIREBASE_PRIVATE_KEY;
    if (pk.startsWith('"') && pk.endsWith('"')) pk = pk.slice(1, -1);
    pk = pk.replace(/\\n/g, '\n');
    pk = pk.replace(/\n{2,}/g, '\n');
    pk = pk.trim();
    result.regularCleanedLength = pk.length;
    result.regularCleanedNewlines = (pk.match(/\n/g) || []).length;

    const { cert } = await import('firebase-admin/app');
    try {
      cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: pk,
      });
      result.regularCertResult = 'SUCCESS';
    } catch (e) {
      result.regularCertResult = 'FAILED: ' + e.message;
    }
  }

  return res.status(200).json(result);
}
