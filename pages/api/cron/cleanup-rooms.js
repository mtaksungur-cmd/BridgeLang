// pages/api/cron/cleanup-rooms.js
/**
 * Cron job to cleanup expired Daily.co rooms
 * Schedule: Run every hour
 * Vercel cron: https://vercel.com/docs/cron-jobs
 */

import { adminDb } from '../../../lib/firebaseAdmin';
import axios from 'axios';

export default async function handler(req, res) {
    // Verify cron secret (security)
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Find lessons older than 24h
        const oldLessons = await adminDb.collection('bookings')
            .where('date', '<', yesterdayStr)
            .where('meetingLink', '!=', null)
            .get();

        let deleted = 0;
        let failed = 0;

        for (const doc of oldLessons.docs) {
            const data = doc.data();

            if (data.meetingLink) {
                try {
                    const roomName = data.meetingLink.split('/').pop();

                    // Delete room from Daily.co
                    await axios.delete(`https://api.daily.co/v1/rooms/${roomName}`, {
                        headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` }
                    });

                    // Remove meetingLink from booking
                    await doc.ref.update({ meetingLink: null });

                    deleted++;
                    console.log(`✅ Deleted room: ${roomName}`);
                } catch (err) {
                    failed++;
                    console.warn(`⚠️ Failed to delete room for booking ${doc.id}:`, err.message);
                }
            }
        }

        console.log(`🧹 Cleanup complete: ${deleted} rooms deleted, ${failed} failed`);

        return res.status(200).json({
            success: true,
            deleted,
            failed,
            message: `Cleanup complete: ${deleted} rooms deleted`
        });

    } catch (error) {
        console.error('Cleanup cron error:', error);
        return res.status(500).json({ error: error.message });
    }
}
