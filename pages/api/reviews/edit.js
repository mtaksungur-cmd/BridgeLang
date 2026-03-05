// pages/api/reviews/edit.js
/**
 * Edit existing review (within 7 days)
 */

import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method !== 'PUT') return res.status(405).end();

    const { reviewId, rating, comment, userId } = req.body;

    if (!reviewId || !rating || !comment || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Get existing review
        const reviewDoc = await adminDb.collection('reviews').doc(reviewId).get();

        if (!reviewDoc.exists) {
            return res.status(404).json({ error: 'Review not found' });
        }

        const review = reviewDoc.data();

        // Verify ownership
        if (review.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to edit this review' });
        }

        // Check if within 7 days
        const reviewDate = review.createdAt.toDate ? review.createdAt.toDate() : new Date(review.createdAt);
        const now = new Date();
        const daysSinceReview = (now - reviewDate) / (1000 * 60 * 60 * 24);

        if (daysSinceReview > 7) {
            return res.status(403).json({ error: 'Reviews can only be edited within 7 days' });
        }

        // Update review
        await adminDb.collection('reviews').doc(reviewId).update({
            rating: Number(rating),
            comment,
            edited: true,
            editedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        console.log(`✅ Review ${reviewId} edited by user ${userId}`);

        return res.status(200).json({
            success: true,
            message: 'Review updated successfully'
        });

    } catch (error) {
        console.error('Edit review error:', error);
        return res.status(500).json({ error: 'Failed to edit review' });
    }
}
