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
        const studentSnap = await adminDb.collection('users').doc(studentId).get();
        if (studentSnap.exists && studentSnap.data().status === 'pending_consent') {
            return res.status(403).json({ allowed: false, reason: 'pending_consent', error: 'Parental consent required before messaging.' });
        }

        const userData = studentSnap.exists ? studentSnap.data() : {};

        // Post-lesson: check messagesAfterLesson map first (fastest)
        const messagesAfterLesson = userData.messagesAfterLesson || {};
        if (messagesAfterLesson[teacherId] === true) {
            return res.status(200).json({ allowed: true, reason: 'post_lesson', unlimited: true });
        }

        // Fallback: check bookings for confirmed/completed/approved lessons
        const bookingQuery = await adminDb.collection('bookings')
            .where('studentId', '==', studentId)
            .where('teacherId', '==', teacherId)
            .where('status', 'in', ['confirmed', 'completed', 'approved'])
            .limit(1)
            .get();

        if (!bookingQuery.empty) {
            return res.status(200).json({ allowed: true, reason: 'booked', unlimited: true });
        }

        // Pre-lesson: plan-based per-conversation limit
        const plan = userData.subscriptionPlan || 'free';
        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
        const preLesson = limits.preLesson ?? limits.messagesLeft;

        if (plan === 'vip') {
            return res.status(200).json({ allowed: true, reason: 'vip', unlimited: true, limit: 'unlimited' });
        }

        const msgsSnap = await adminDb.collection('conversations').doc(chatId)
            .collection('messages')
            .where('senderId', '==', studentId)
            .get();

        const count = msgsSnap.size;

        if (count >= preLesson) {
            return res.status(200).json({
                allowed: false,
                reason: 'limit_reached',
                plan,
                count,
                limit: preLesson,
                message: `You've used your ${preLesson} pre-lesson messages. Book a lesson to unlock unlimited messaging with this tutor.`
            });
        }

        return res.status(200).json({
            allowed: true,
            reason: 'pre_lesson',
            count,
            limit: preLesson,
            remaining: preLesson - count
        });

    } catch (err) {
        console.error('checkLimit error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}
