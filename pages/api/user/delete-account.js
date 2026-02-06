// pages/api/user/delete-account.js
/**
 * GDPR Article 17: Right to Be Forgotten
 * Anonymize or delete user account
 */

import { adminDb, adminAuth } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { userId, confirmDelete } = req.body;

        if (!userId || confirmDelete !== true) {
            return res.status(400).json({
                error: 'Missing userId or confirmation'
            });
        }

        console.log(`🗑️ Deleting account: ${userId}`);

        // Check for active bookings
        const activeBookings = await adminDb.collection('bookings')
            .where('studentId', '==', userId)
            .where('status', 'in', ['confirmed', 'approved'])
            .get();

        if (!activeBookings.empty) {
            return res.status(400).json({
                error: `Cannot delete account with ${activeBookings.size} active booking(s). Please cancel them first.`,
                activeBookings: activeBookings.size
            });
        }

        // Anonymize user data (keep for legal/transaction records)
        const timestamp = new Date().toISOString();
        const anonymizedEmail = `deleted-${userId}@bridgelang.deleted`;

        await adminDb.collection('users').doc(userId).update({
            name: '[Deleted User]',
            email: anonymizedEmail,
            bio: '',
            profilePicture: null,
            deletedAt: timestamp,
            status: 'deleted',
            // Keep: role, lessonsTaken (for analytics)
        });

        // Delete Firebase Auth
        try {
            await adminAuth.deleteUser(userId);
            console.log('✅ Firebase Auth user deleted');
        } catch (authError) {
            console.warn('Firebase Auth delete failed (user may not exist):', authError.message);
        }

        // Anonymize bookings (keep for records but remove PII)
        const userBookings = await adminDb.collection('bookings')
            .where('studentId', '==', userId)
            .get();

        const batch = adminDb.batch();
        userBookings.docs.forEach(doc => {
            batch.update(doc.ref, {
                studentName: '[Deleted User]',
                studentEmail: anonymizedEmail
            });
        });
        await batch.commit();

        console.log(`✅ Account deleted: ${userId}`);
        console.log(`  - ${userBookings.size} bookings anonymized`);

        return res.status(200).json({
            success: true,
            message: 'Account successfully deleted',
            anonymizedBookings: userBookings.size
        });

    } catch (error) {
        console.error('Account deletion error:', error);
        return res.status(500).json({ error: 'Failed to delete account' });
    }
}
