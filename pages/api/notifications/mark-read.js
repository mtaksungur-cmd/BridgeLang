import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { notificationIds, userId } = req.body;

    if (!notificationIds || !userId) {
        return res.status(400).json({ error: 'Missing notification IDs or user ID' });
    }

    try {
        const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

        // Batch update all notifications
        const batch = adminDb.batch();

        for (const notifId of ids) {
            const notifRef = adminDb.collection('notifications').doc(notifId);
            batch.update(notifRef, { read: true });
        }

        await batch.commit();

        console.log(`✅ Marked ${ids.length} notification(s) as read for user ${userId}`);

        return res.status(200).json({ success: true, count: ids.length });
    } catch (error) {
        console.error('Mark read error:', error);
        return res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
}
