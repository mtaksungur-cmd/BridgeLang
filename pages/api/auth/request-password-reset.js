import { adminDb } from '../../../lib/firebaseAdmin';
import crypto from 'crypto';
import { sendPasswordReset } from '../../../lib/authEmails';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        console.log('🔑 Password reset requested for:', email);

        // Find user by email
        const usersSnap = await adminDb
            .collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();

        if (usersSnap.empty) {
            // Don't reveal if email exists (security best practice)
            console.log('⚠️ Email not found, but returning success');
            return res.status(200).json({
                success: true,
                message: 'If an account exists, password reset link has been sent'
            });
        }

        const userDoc = usersSnap.docs[0];
        const userData = userDoc.data();
        const uid = userDoc.id;

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto
            .createHmac('sha256', process.env.UNPAUSE_TOKEN_SECRET || 'fallback-secret')
            .update(resetToken)
            .digest('hex');

        const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

        // Save to user document
        await adminDb.collection('users').doc(uid).update({
            passwordResetToken: resetTokenHash,
            passwordResetExpires: expiresAt,
        });

        // Generate reset link
        const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}&uid=${uid}`;

        // Send modern email
        await sendPasswordReset({
            to: email,
            userName: userData?.name || '',
            resetLink,
        });

        console.log(`✅ Password reset email sent to ${email}`);

        return res.status(200).json({
            success: true,
            message: 'Password reset link has been sent to your email',
        });

    } catch (error) {
        console.error('❌ Password reset error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to process password reset request',
        });
    }
}
