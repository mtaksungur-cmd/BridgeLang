// pages/api/profile-view/track.js - Track student views of teacher profiles
import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { studentId, teacherId } = req.body;

        if (!studentId || !teacherId) {
            return res.status(400).json({ error: 'Missing studentId or teacherId' });
        }

        // Record profile view
        await adminDb.collection('profileViews').add({
            studentId,
            teacherId,
            viewedAt: new Date(),
            source: 'teacher_profile_page'
        });

        console.log(`👁️ Profile view tracked: ${studentId} → ${teacherId}`);

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error('Profile view tracking error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
