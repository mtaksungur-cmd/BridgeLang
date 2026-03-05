// pages/api/cron/cleanup-notifications.js
/**
 * Delete expired notifications (>7 days old)
 * Runs daily via Vercel Cron
 */

import { deleteExpiredNotifications } from '../../../lib/notifications';

export default async function handler(req, res) {
    // Verify cron secret
    const authHeader = req.headers.authorization;

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn('⚠️ Unauthorized cron attempt');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🗑️ Starting notification cleanup...');

    try {
        const result = await deleteExpiredNotifications();

        console.log(`✅ Cleanup complete: ${result.count} notifications deleted`);

        return res.status(200).json({
            success: true,
            deleted: result.count
        });

    } catch (error) {
        console.error('❌ Notification cleanup error:', error);
        return res.status(500).json({ error: error.message });
    }
}
