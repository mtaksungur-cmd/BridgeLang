import { adminDb } from '../../../lib/firebaseAdmin';

const PLAN_LIMITS = {
    free: 5,
    starter: 10,
    pro: 20,
    vip: 9999
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    let { studentId, teacherId, chatId } = req.body;

    if (!chatId) return res.status(400).json({ error: 'Missing chatId' });

    if (!studentId || !teacherId) {
        try {
            const chatSnap = await adminDb.collection('chats').doc(chatId).get();
            if (!chatSnap.exists) return res.status(404).json({ error: 'Chat not found' });
            const cData = chatSnap.data();
            studentId = studentId || cData.studentId;
            teacherId = teacherId || cData.teacherId;
        } catch (err) {
            return res.status(500).json({ error: 'Failed to fetch chat info' });
        }
    }

    if (!studentId || !teacherId) return res.status(400).json({ error: 'Missing ids' });

    try {
        const bookingQuery = await adminDb.collection('bookings')
            .where('studentId', '==', studentId)
            .where('teacherId', '==', teacherId)
            .where('status', 'in', ['confirmed', 'completed', 'approved'])
            .limit(1)
            .get();

        if (!bookingQuery.empty) {
            return res.status(200).json({ allowed: true, reason: 'booked' });
        }

        const userSnap = await adminDb.collection('users').doc(studentId).get();
        const user = userSnap.data() || {};
        const plan = user.subscriptionPlan || 'free';
        const limit = PLAN_LIMITS[plan] || 5;

        const msgsSnap = await adminDb.collection('chats').doc(chatId)
            .collection('messages')
            .where('sender', '==', studentId)
            .count()
            .get();

        const count = msgsSnap.data().count;

        if (count >= limit) {
            return res.status(200).json({
                allowed: false,
                reason: 'limit_reached',
                plan,
                limit
            });
        }

        return res.status(200).json({ allowed: true, count, limit });

    } catch (err) {
        console.error('checkLimit error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}
