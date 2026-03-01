// pages/api/admin/setup-admin.js
// One-time bootstrap endpoint to set a user's role to 'admin' in Firestore.
// Only works if there are NO existing admin users — safe bootstrap pattern.
// DELETE THIS FILE after first admin is created for security.

import { adminDb, adminAuth } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Safety check: only allow if no admin exists yet
    const existingAdmins = await adminDb
      .collection('users')
      .where('role', '==', 'admin')
      .limit(1)
      .get();

    if (!existingAdmins.empty) {
      return res.status(403).json({ error: 'An admin already exists. This bootstrap endpoint is disabled.' });
    }

    // Find user by email in Firebase Auth
    const userRecord = await adminAuth.getUserByEmail(email);
    if (!userRecord?.uid) {
      return res.status(404).json({ error: 'User not found in Firebase Auth' });
    }

    const uid = userRecord.uid;

    // Check if user doc exists in Firestore
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      await userRef.set({
        email: email,
        role: 'admin',
        name: 'Admin',
        createdAt: new Date(),
      });
      return res.json({ ok: true, action: 'created', uid, message: 'Admin user document created with role: admin' });
    }

    // Update existing doc role to admin
    const previousRole = userSnap.data().role || 'none';
    await userRef.update({ role: 'admin' });

    return res.json({
      ok: true,
      action: 'updated',
      uid,
      previousRole,
      message: `User role updated from '${previousRole}' to 'admin'`,
    });
  } catch (err) {
    console.error('setup-admin error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
