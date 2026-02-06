// pages/api/reviews/reply.js
/**
 * Teacher reply to review
 */

import { adminDb } from '../../../lib/firebaseAdmin';
import { notifyReviewReply } from '../../../lib/notifications';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { reviewId, teacherId, replyText } = req.body;

    if (!reviewId || !teacherId || !replyText) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (replyText.length > 500) {
        return res.status(400).json({ error: 'Reply must be 500 characters or less' });
    }

    try {
        // Get review
        const reviewDoc = await adminDb.collection('reviews').doc(reviewId).get();

        if (!reviewDoc.exists) {
            return res.status(404).json({ error: 'Review not found' });
        }

        const review = reviewDoc.data();

        // Verify this is the teacher being reviewed
        if (review.teacherId !== teacherId) {
            return res.status(403).json({ error: 'Not authorized to reply to this review' });
        }

        // Check if already replied
        if (review.teacherReply) {
            return res.status(400).json({ error: 'You have already replied to this review' });
        }

        // Add reply
        await adminDb.collection('reviews').doc(reviewId).update({
            teacherReply: replyText,
            teacherReplyDate: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        console.log(`✅ Teacher ${teacherId} replied to review ${reviewId}`);

        // Send notification to student
        try {
            const teacherDoc = await adminDb.collection('users').doc(teacherId).get();
            const teacher = teacherDoc.data() || {};

            await adminDb.collection('notifications').add({
                userId: review.userId,
                type: 'review_reply',
                title: 'Teacher Replied',
                message: `${teacher.name || 'Your teacher'} replied to your review`,
                actionUrl: `/teacher/${teacherId}`,
                metadata: { reviewId, teacherId },
                read: false,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });
        } catch (notifError) {
            console.warn('Failed to send notification:', notifError);
        }

        return res.status(200).json({
            success: true,
            message: 'Reply added successfully'
        });

    } catch (error) {
        console.error('Reply error:', error);
        return res.status(500).json({ error: 'Failed to add reply' });
    }
}
