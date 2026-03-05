// pages/api/reviews/report.js
/**
 * Report inappropriate review
 */

import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { reviewId, reportedBy, reason, description } = req.body;

    if (!reviewId || !reportedBy || !reason) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const validReasons = [
        'spam',
        'inappropriate_language',
        'false_information',
        'harassment',
        'other'
    ];

    if (!validReasons.includes(reason)) {
        return res.status(400).json({ error: 'Invalid reason' });
    }

    try {
        // Check if review exists
        const reviewDoc = await adminDb.collection('reviews').doc(reviewId).get();

        if (!reviewDoc.exists) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Check if user already reported this review
        const existingReport = await adminDb.collection('reviewReports')
            .where('reviewId', '==', reviewId)
            .where('reportedBy', '==', reportedBy)
            .get();

        if (!existingReport.empty) {
            return res.status(400).json({ error: 'You have already reported this review' });
        }

        // Create report
        const report = {
            reviewId,
            reportedBy,
            reason,
            description: description || '',
            status: 'pending', // pending | reviewed | dismissed | action_taken
            createdAt: new Date().toISOString(),
            reviewedAt: null,
            reviewedBy: null,
            adminNotes: null
        };

        await adminDb.collection('reviewReports').add(report);

        console.log(`⚠️ Review ${reviewId} reported by ${reportedBy} for: ${reason}`);

        return res.status(200).json({
            success: true,
            message: 'Report submitted successfully. Our team will review it.'
        });

    } catch (error) {
        console.error('Report error:', error);
        return res.status(500).json({ error: 'Failed to submit report' });
    }
}
