// middleware/emailVerificationCheck.js
/**
 * Middleware to enforce email verification
 * Add this check before critical actions like booking
 */

export function requireEmailVerification(user) {
    if (!user) {
        throw new Error('User not authenticated');
    }

    if (!user.emailVerified && !user.isEmailVerified) {
        throw new Error('EMAIL_NOT_VERIFIED');
    }

    return true;
}

export function getVerificationMessage() {
    return 'Please verify your email before booking lessons. Check your inbox for the verification link or request a new one from your profile.';
}
