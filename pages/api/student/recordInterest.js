import { adminDb } from '../../../lib/firebaseAdmin';
import admin from 'firebase-admin';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    const { studentId, teacherId, action } = req.body;

    if (!studentId || !teacherId) return res.status(400).json({ error: 'Missing ids' });

    try {
        await adminDb.collection('interests')
            .doc(teacherId)
            .collection('students')
            .doc(studentId)
            .set({
                lastInteraction: admin.firestore.FieldValue.serverTimestamp(),
                action: action || 'view',
                notifiedAt: null
            }, { merge: true });

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('recordInterest error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}
