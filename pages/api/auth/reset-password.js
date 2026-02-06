// pages/api/auth/reset-password.js
import { adminDb, adminAuth } from '../../../lib/firebaseAdmin';
import crypto from 'crypto';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { token, uid, newPassword } = req.body;

        if (!token || !uid || !newPassword) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        console.log('🔑 Processing password reset for uid:', uid);

        // Get user document
        const userDoc = await adminDb.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();

        // Verify token hasn't expired
        if (!userData.passwordResetExpires || Date.now() > userData.passwordResetExpires) {
            return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
        }

        // Hash the provided token and compare
        const tokenHash = crypto
            .createHmac('sha256', process.env.UNPAUSE_TOKEN_SECRET || 'fallback-secret')
            .update(token)
            .digest('hex');

        if (tokenHash !== userData.passwordResetToken) {
            return res.status(400).json({ error: 'Invalid reset token' });
        }

        // Update password in Firebase Auth
        await adminAuth.updateUser(uid, {
            password: newPassword,
        });

        // Clear reset token from user document
        await adminDb.collection('users').doc(uid).update({
            passwordResetToken: null,
            passwordResetExpires: null,
            updatedAt: new Date().toISOString(),
        });

        console.log(`✅ Password successfully reset for uid: ${uid}`);

        return res.status(200).json({
            success: true,
            message: 'Password reset successful',
        });

    } catch (error) {
        console.error('❌ Password reset error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to reset password',
        });
    }
}
