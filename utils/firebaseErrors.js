// Error message mapping for Firebase and API errors
export const getErrorMessage = (errorCode) => {
    const messages = {
        // Firebase Auth Errors
        'auth/user-not-found': 'No account found with this email address.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-email': 'Invalid email format.',
        'auth/email-already-in-use': 'This email address is already registered.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your internet connection.',
        'auth/requires-recent-login': 'Please log in again to perform this action.',
        'auth/invalid-credential': 'Invalid credentials. Please check your information.',
        'auth/operation-not-allowed': 'This operation is not currently supported.',
        'auth/account-exists-with-different-credential': 'An account with this email already exists using a different sign-in method.',

        // API Errors (from verify-login-code, etc.)
        'Invalid code': 'The verification code you entered is incorrect.',
        'Code expired': 'This verification code has expired. Please request a new one.',
        'No active code found': 'No verification code found. Please try logging in again.',
        'User not found': 'No account found with this email address.',
        'Missing email or code': 'Please provide both email and verification code.',
        'send-code-failed': 'Failed to send verification code. Please try again.',
        'account-paused': 'Your account has been paused. A reactivation link has been sent to your email.',

        // Generic
        'default': 'An error occurred. Please try again.'
    };

    return messages[errorCode] || messages['default'];
};

// Extract error code from various error sources
export const getErrorCode = (error) => {
    // If it's already a string, return it
    if (typeof error === 'string') return error;

    // Firebase error object
    if (error?.code) return error.code;

    // Error message (API errors)
    if (error?.message) return error.message;

    // HTTP response error
    if (error?.error) return error.error;

    return 'default';
};

// Legacy export for compatibility
export const getFirebaseErrorMessage = getErrorMessage;
