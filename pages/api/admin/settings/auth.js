import { adminDb } from '../../../../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const settingsDoc = await adminDb.collection('platformSettings').doc('auth').get();
            const settings = settingsDoc.exists ? settingsDoc.data() : { otpEnabled: false };

            return res.status(200).json({
                otpEnabled: settings.otpEnabled || false
            });
        } catch (error) {
            console.error('Settings fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch settings' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { otpEnabled } = req.body;

            if (typeof otpEnabled !== 'boolean') {
                return res.status(400).json({ error: 'Invalid input' });
            }

            await adminDb.collection('platformSettings').doc('auth').set({
                otpEnabled,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            return res.status(200).json({
                success: true,
                otpEnabled
            });
        } catch (error) {
            console.error('Settings update error:', error);
            return res.status(500).json({ error: 'Failed to update settings' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
