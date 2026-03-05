// pages/api/user/export-data.js
/**
 * GDPR Article 15: Right to Data Portability
 * Export all user data in JSON format
 */

import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();

    try {
        // Simple auth check via query param (in production, use proper auth)
        const userId = req.query.userId;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId parameter' });
        }

        console.log(`📦 Exporting data for user: ${userId}`);

        // Gather all user data
        const [userDoc, bookingsDocs, transactionsDocs] = await Promise.all([
            adminDb.collection('users').doc(userId).get(),
            adminDb.collection('bookings')
                .where('studentId', '==', userId)
                .get(),
            adminDb.collection('transactions')
                .where('userId', '==', userId)
                .get()
        ]);

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Compile export data
        const exportData = {
            user: {
                id: userId,
                ...userDoc.data()
            },
            bookings: bookingsDocs.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })),
            transactions: transactionsDocs.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })),
            exportMetadata: {
                exportedAt: new Date().toISOString(),
                exportVersion: '1.0',
                totalBookings: bookingsDocs.size,
                totalTransactions: transactionsDocs.size
            }
        };

        console.log(`✅ Export complete: ${bookingsDocs.size} bookings, ${transactionsDocs.size} transactions`);

        // Return as downloadable JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="bridgelang-data-${userId}-${Date.now()}.json"`);

        return res.status(200).json(exportData);

    } catch (error) {
        console.error('Data export error:', error);
        return res.status(500).json({ error: 'Failed to export data' });
    }
}
