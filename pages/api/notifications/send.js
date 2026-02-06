import { adminDb } from '../../../lib/firebaseAdmin';
import { sendNotificationEmail } from '../../../lib/emailService';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userId, type, title, message, link, senderId, senderName, senderPhoto, sendEmail } = req.body;

    if (!userId || !type || !title || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Create notification in Firestore
        const notificationRef = await adminDb.collection('notifications').add({
            userId,
            type,
            title,
            message,
            link: link || '',
            read: false,
            createdAt: new Date(),
            senderId: senderId || null,
            senderName: senderName || null,
            senderPhoto: senderPhoto || null,
        });

        console.log(`✅ Notification created: ${notificationRef.id} for user ${userId}`);

        // Send email if requested
        if (sendEmail && sendEmail !== 'false') {
            try {
                // Get recipient's email and name
                const userDoc = await adminDb.collection('users').doc(userId).get();
                const userData = userDoc.data();

                if (userData?.email) {
                    const fullLink = `${process.env.NEXT_PUBLIC_BASE_URL}${link || '/'}`;
                    await sendNotificationEmail({
                        to: userData.email,
                        userName: userData.name || userData.email,
                        senderName: senderName || 'Someone',
                        messagePreview: message,
                        link: fullLink,
                    });
                }
            } catch (emailError) {
                console.error('❌ Email send failed:', emailError);
                // Don't fail the whole request if email fails
            }
        }

        return res.status(200).json({
            success: true,
            notificationId: notificationRef.id
        });
    } catch (error) {
        console.error('Notification send error:', error);
        return res.status(500).json({ error: 'Failed to send notification' });
    }
}
