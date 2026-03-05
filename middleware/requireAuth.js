// middleware/requireAuth.js
/**
 * Authentication middleware for API routes
 * Verifies Firebase auth token and attaches userId to request
 */

import { adminAuth } from '../lib/firebaseAdmin';

export function requireAuth(handler, options = {}) {
    return async (req, res) => {
        try {
            // Get token from Authorization header
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                console.warn('Missing or invalid Authorization header');
                return res.status(401).json({
                    error: 'Unauthorized. Please provide a valid authentication token.'
                });
            }

            const token = authHeader.replace('Bearer ', '');

            // Verify Firebase ID token
            const decodedToken = await adminAuth.verifyIdToken(token);

            // Attach user ID to request
            req.userId = decodedToken.uid;
            req.userEmail = decodedToken.email;

            // Optional: Check user role
            if (options.requiredRole) {
                const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
                const userData = userDoc.data();

                if (!userData || userData.role !== options.requiredRole) {
                    return res.status(403).json({
                        error: `Access denied. Required role: ${options.requiredRole}`
                    });
                }

                req.userRole = userData.role;
            }

            // Call the actual handler
            return handler(req, res);

        } catch (error) {
            console.error('Auth verification failed:', error);

            if (error.code === 'auth/id-token-expired') {
                return res.status(401).json({
                    error: 'Token expired. Please sign in again.'
                });
            }

            return res.status(401).json({
                error: 'Invalid authentication token.'
            });
        }
    };
}

export function optionalAuth(handler) {
    return async (req, res) => {
        try {
            const authHeader = req.headers.authorization;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.replace('Bearer ', '');
                const decodedToken = await adminAuth.verifyIdToken(token);
                req.userId = decodedToken.uid;
                req.userEmail = decodedToken.email;
            }
        } catch (error) {
            // Silent fail - auth is optional
            console.warn('Optional auth failed:', error.message);
        }

        return handler(req, res);
    };
}
