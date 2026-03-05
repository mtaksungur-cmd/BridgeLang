import { adminDb } from '../../../lib/firebaseAdmin';
import { PLAN_LIMITS } from '../../../lib/planLimits';

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

        if (studentData.status === 'pending_consent') {
            return res.status(403).json({
                canMessage: false,
                error: 'Your account is pending parental consent. Please wait for your parent/guardian to confirm.'
            });
        }

        const plan = studentData.subscriptionPlan || 'free';

        // Post-lesson: unlimited messaging with tutors you've had a lesson with
        const messagesAfterLesson = studentData.messagesAfterLesson || {};
        if (messagesAfterLesson[teacherId] === true) {
            return res.status(200).json({
                canMessage: true,
                unlimited: true,
                postLesson: true,
                reason: 'Unlimited messaging after your lesson with this tutor'
            });
        }

        // Also check bookings directly as a fallback
        const bookingQuery = await adminDb.collection('bookings')
            .where('studentId', '==', studentId)
            .where('teacherId', '==', teacherId)
            .where('status', 'in', ['confirmed', 'completed', 'approved'])
            .limit(1)
            .get();

        if (!bookingQuery.empty) {
            return res.status(200).json({
                canMessage: true,
                unlimited: true,
                postLesson: true,
                reason: 'Unlimited messaging after booking with this tutor'
            });
        }

        // Pre-lesson: plan-based limits for new tutors
        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
        const preLesson = limits.preLesson ?? limits.messagesLeft;

        if (plan === 'vip') {
            return res.status(200).json({
                canMessage: true,
                unlimited: true,
                postLesson: false,
                messagesLeft: 'unlimited',
                limit: 'unlimited'
            });
        }

        const messagesLeft = studentData.messagesLeft ?? preLesson;

        if (messagesLeft > 0) {
            return res.status(200).json({
                canMessage: true,
                unlimited: false,
                postLesson: false,
                messagesLeft,
                limit: preLesson
            });
        }

        return res.status(403).json({
            canMessage: false,
            messagesLeft: 0,
            limit: preLesson,
            error: 'Pre-lesson message limit reached. Book a lesson to unlock unlimited messaging with this tutor, or upgrade your plan.'
        });

    } catch (err) {
        console.error('Check limit error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
