const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { setGlobalOptions } = require("firebase-functions/v2");

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ maxInstances: 10 });

// Review coupon creation is handled solely by the API route /api/review/[lessonId].js
// This Cloud Function only logs the event for analytics.
exports.onReviewCreated = onDocumentCreated("reviews/{reviewId}", async (event) => {
    const review = event.data.data();
    if (!review) return;

    const { studentId, teacherId } = review;
    console.log(`Review created by student ${studentId} for teacher ${teacherId}`);
});

exports.onTutorAvailabilityUpdate = onDocumentUpdated("users/{tutorId}", async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    if (!beforeData || !afterData) return;
    if (afterData.role !== 'teacher') return;

    const availabilityChanged = JSON.stringify(beforeData.availability) !== JSON.stringify(afterData.availability);

    if (!availabilityChanged) return;

    const tutorId = event.params.tutorId;

    try {
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

        const interestsSnap = await db.collection('interests')
            .doc(tutorId)
            .collection('students')
            .get();

        if (interestsSnap.empty) {
            console.log(`No interested students for tutor ${tutorId}`);
            return;
        }

        for (const doc of interestsSnap.docs) {
            const studentId = doc.id;
            const interestData = doc.data();
            const lastInteraction = interestData.lastInteraction?.toMillis() || 0;
            const lastNotified = interestData.notifiedAt?.toMillis() || 0;

            if (lastInteraction < sevenDaysAgo) continue;
            if (lastNotified > oneDayAgo) continue;

            const bookingQuery = await db.collection('bookings')
                .where('studentId', '==', studentId)
                .where('teacherId', '==', tutorId)
                .where('status', 'in', ['confirmed', 'completed', 'approved'])
                .limit(1)
                .get();

            if (!bookingQuery.empty) continue;

            await db.collection('users').doc(studentId)
                .collection('notifications')
                .add({
                    type: 'tutor_availability',
                    tutorId: tutorId,
                    message: 'A tutor you viewed has updated their availability. Book your lesson now!',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    read: false
                });

            await db.collection('interests')
                .doc(tutorId)
                .collection('students')
                .doc(studentId)
                .update({
                    notifiedAt: admin.firestore.FieldValue.serverTimestamp()
                });

            console.log(`Notification sent to student ${studentId} about tutor ${tutorId} availability`);
        }

    } catch (err) {
        console.error("Error in onTutorAvailabilityUpdate:", err);
    }
});


