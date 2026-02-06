// pages/api/messages/check-limit.js
import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { studentId, teacherId } = req.body;

        if (!studentId || !teacherId) {
            return res.status(400).json({ error: 'Missing studentId or teacherId' });
        }

        const studentRef = adminDb.collection('users').doc(studentId);
        const studentSnap = await studentRef.get();

        if (!studentSnap.exists) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const studentData = studentSnap.data();
        const plan = studentData.subscriptionPlan || 'free';

        // Check if student has unlimited messaging with this teacher (after first lesson)
        const messagesAfterLesson = studentData.messagesAfterLesson || {};
        if (messagesAfterLesson[teacherId] === true) {
            return res.status(200).json({
                canMessage: true,
                unlimited: true,
                reason: 'Unlimited messaging after first lesson'
            });
        }

        // Check plan-based limits
        const planLimits = {
            free: 5,
            starter: 10,
            pro: 20,
            vip: Infinity  // Unlimited
        };

        const limit = planLimits[plan] || 5;
        const messagesLeft = studentData.messagesLeft ?? limit;

        if (messagesLeft > 0 || limit === Infinity) {
            return res.status(200).json({
                canMessage: true,
                unlimited: limit === Infinity,
                messagesLeft: limit === Infinity ? 'unlimited' : messagesLeft,
                limit: limit === Infinity ? 'unlimited' : limit
            });
        }

        return res.status(403).json({
            canMessage: false,
            messagesLeft: 0,
            limit,
            error: 'Message limit reached. Complete a lesson or upgrade your plan.'
        });

    } catch (err) {
        console.error('Check limit error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
