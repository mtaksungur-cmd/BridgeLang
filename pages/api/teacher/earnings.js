// pages/api/teacher/earnings.js
/**
 * Teacher Earnings Stats API
 * Returns earnings, transfers, and analytics
 */

import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();

    const { teacherId } = req.query;

    if (!teacherId) {
        return res.status(400).json({ error: 'Missing teacherId' });
    }

    try {
        // Get all completed bookings for this teacher
        const bookingsSnapshot = await adminDb.collection('bookings')
            .where('teacherId', '==', teacherId)
            .where('status', '==', 'completed')
            .get();

        // Get all transfers
        const transfersSnapshot = await adminDb.collection('bookings')
            .where('teacherId', '==', teacherId)
            .where('transferStatus', '==', 'completed')
            .get();

        // Calculate stats
        let totalEarnings = 0;
        let pendingTransfers = 0;
        let completedTransfers = 0;
        let introLessons = 0;
        let standardLessons = 0;

        const monthlyEarnings = {}; // { '2026-02': 123.45 }
        const transferHistory = [];

        bookingsSnapshot.docs.forEach(doc => {
            const booking = doc.data();
            const amount = booking.teacherAmount || 0;

            totalEarnings += amount;

            // Count lesson types
            if (booking.lessonType === 'intro') {
                introLessons++;
            } else {
                standardLessons++;
            }

            // Group by month
            if (booking.createdAt) {
                const date = booking.createdAt.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyEarnings[monthKey] = (monthlyEarnings[monthKey] || 0) + amount;
            }

            // Check transfer status
            if (booking.transferStatus === 'pending') {
                pendingTransfers += amount;
            } else if (booking.transferStatus === 'completed') {
                completedTransfers += amount;

                transferHistory.push({
                    id: doc.id,
                    date: booking.transferredAt || booking.createdAt,
                    amount: amount,
                    bookingId: doc.id,
                    status: 'completed'
                });
            }
        });

        // Sort transfer history by date (most recent first)
        transferHistory.sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
            return dateB - dateA;
        });

        // Format monthly earnings for chart
        const monthlyData = Object.entries(monthlyEarnings)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, amount]) => ({
                month,
                amount: Number(amount.toFixed(2))
            }));

        const stats = {
            totalEarnings: Number(totalEarnings.toFixed(2)),
            pendingTransfers: Number(pendingTransfers.toFixed(2)),
            completedTransfers: Number(completedTransfers.toFixed(2)),
            totalLessons: bookingsSnapshot.size,
            introLessons,
            standardLessons,
            monthlyEarnings: monthlyData,
            transferHistory: transferHistory.slice(0, 10), // Last 10 transfers
            averagePerLesson: bookingsSnapshot.size > 0
                ? Number((totalEarnings / bookingsSnapshot.size).toFixed(2))
                : 0
        };

        return res.status(200).json(stats);

    } catch (error) {
        console.error('Earnings API error:', error);
        return res.status(500).json({ error: 'Failed to fetch earnings' });
    }
}
