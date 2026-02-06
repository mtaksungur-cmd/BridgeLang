import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔧 Starting booking status migration...');

        const bookingsSnapshot = await adminDb
            .collection('bookings')
            .where('status', '==', 'confirmed')
            .get();

        console.log(`📊 Found ${bookingsSnapshot.docs.length} bookings with status 'confirmed'`);

        const batch = adminDb.batch();
        bookingsSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { status: 'approved' });
        });

        await batch.commit();

        console.log('✅ Migration complete!');

        return res.status(200).json({
            success: true,
            message: `Updated ${bookingsSnapshot.docs.length} bookings from 'confirmed' to 'approved'`,
            count: bookingsSnapshot.docs.length
        });

    } catch (error) {
        console.error('❌ Migration error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
