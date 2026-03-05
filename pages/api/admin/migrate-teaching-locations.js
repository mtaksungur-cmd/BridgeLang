import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🏫 Running teacher location migration...');

        // Get all teachers
        const teachersSnap = await adminDb
            .collection('users')
            .where('role', '==', 'teacher')
            .get();

        console.log(`📊 Found ${teachersSnap.docs.length} teachers`);

        // Batch update
        const batch = adminDb.batch();

        teachersSnap.docs.forEach(doc => {
            const data = doc.data();

            // Skip if teachingLocations already exists
            if (data.teachingLocations) {
                console.log(`⏭️ Skipping ${doc.id} - already has teachingLocations`);
                return;
            }

            // Default: Online + Teacher's Home (most common setup)
            const defaultLocations = ['Online', "Teacher's Home"];

            console.log(`✅ Updating ${doc.id} with default locations:`, defaultLocations);

            batch.update(doc.ref, {
                teachingLocations: defaultLocations
            });
        });

        await batch.commit();

        console.log('✅ Migration complete!');

        return res.status(200).json({
            success: true,
            message: `Updated ${teachersSnap.docs.length} teachers with default teaching locations`,
            teachersUpdated: teachersSnap.docs.length
        });

    } catch (error) {
        console.error('❌ Migration error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
