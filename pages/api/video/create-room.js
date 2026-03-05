import axios from 'axios';
import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { bookingId, duration = 60 } = req.body;

    if (!bookingId) {
        return res.status(400).json({ error: 'Booking ID required' });
    }

    try {
        const DAILY_API_KEY = process.env.DAILY_API_KEY;

        if (!DAILY_API_KEY) {
            throw new Error('DAILY_API_KEY not configured');
        }

        console.log('🎥 Creating Daily.co room for booking:', bookingId);

        // Create room via Daily.co API
        const response = await axios.post('https://api.daily.co/v1/rooms', {
            name: `lesson-${bookingId}`,
            privacy: 'private',
            properties: {
                exp: Math.floor(Date.now() / 1000) + (duration * 60) + 3600, // duration + 1 hour buffer
                enable_chat: true,
                enable_screenshare: true,
                enable_recording: 'cloud',
                max_participants: 2,
                start_video_off: false,
                start_audio_off: false
            }
        }, {
            headers: {
                'Authorization': `Bearer ${DAILY_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const roomUrl = response.data.url;
        const roomName = response.data.name;

        console.log('✅ Room created:', roomUrl);

        // Update booking with meeting link
        await adminDb.collection('bookings').doc(bookingId).update({
            meetingLink: roomUrl,
            roomName: roomName,
            videoProvider: 'daily.co',
            roomCreatedAt: new Date().toISOString()
        });

        console.log('✅ Booking updated with meeting link');

        return res.status(200).json({
            success: true,
            url: roomUrl,
            roomName: roomName
        });

    } catch (error) {
        console.error('❌ Error creating room:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            error: error.response?.data?.info || error.message
        });
    }
}
