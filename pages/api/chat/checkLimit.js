import { adminDb } from '../../../lib/firebaseAdmin';
import { PLAN_LIMITS } from '../../../lib/planLimits';

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
        // Parental consent check
        const studentSnap = await adminDb.collection('users').doc(studentId).get();
        if (studentSnap.exists && studentSnap.data().status === 'pending_consent') {
            return res.status(403).json({ allowed: false, reason: 'pending_consent', error: 'Parental consent required before messaging.' });
        }
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
        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

        const msgsSnap = await adminDb.collection('conversations').doc(chatId)
            .collection('messages')
            .where('senderId', '==', studentId)
            .get();

        const count = msgsSnap.size;

        if (count >= limits.messagesLeft && plan !== 'vip') {
            return res.status(200).json({
                allowed: false,
                reason: 'limit_reached',
                plan,
                limit: limits.messagesLeft
            });
        }

        return res.status(200).json({ allowed: true, count, limit: limits.messagesLeft });

    } catch (err) {
        console.error('checkLimit error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}
