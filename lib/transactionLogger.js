// lib/transactionLogger.js
/**
 * Transaction history logger for all payment-related events
 */

import { adminDb } from './firebaseAdmin';

/**
 * Log a transaction to history
 * @param {Object} transaction
 */
export async function logTransaction(transaction) {
    const {
        type, // 'payment', 'refund', 'payout', 'cancellation'
        bookingId,
        userId,
        amount,
        currency = 'GBP',
        stripeId, // payment_intent, refund, transfer id
        status, // 'success', 'failed', 'pending'
        metadata = {}
    } = transaction;

    try {
        await adminDb.collection('transactions').add({
            type,
            bookingId,
            userId,
            amount,
            currency,
            stripeId,
            status,
            metadata,
            timestamp: new Date().toISOString(),
            createdAt: adminDb.FieldValue.serverTimestamp()
        });

        console.log(`✅ Transaction logged: ${type} - ${amount} ${currency}`);
    } catch (err) {
        console.error('❌ Transaction logging failed:', err.message);
        // Don't throw - logging failure shouldn't break the main flow
    }
}

/**
 * Get transaction history for a user
 */
export async function getUserTransactions(userId, limit = 50) {
    try {
        const snapshot = await adminDb.collection('transactions')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (err) {
        console.error('Failed to fetch transactions:', err);
        return [];
    }
}

/**
 * Get transaction history for a booking
 */
export async function getBookingTransactions(bookingId) {
    try {
        const snapshot = await adminDb.collection('transactions')
            .where('bookingId', '==', bookingId)
            .orderBy('createdAt', 'asc')
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (err) {
        console.error('Failed to fetch booking transactions:', err);
        return [];
    }
}
