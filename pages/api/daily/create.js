import { DateTime } from 'luxon';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  const { date, startTime, duration, timezone } = req.body;

  if (!duration || typeof duration !== 'number') {
    return res.status(400).json({ error: 'Missing or invalid duration' });
  }

  try {
    // Parse lesson start time
    const dt = DateTime.fromFormat(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm', { zone: timezone || 'UTC' });
    const startSec = dt.toSeconds();

    // ✅ Room accessible 15 minutes BEFORE lesson start
    const nbfSec = startSec - (15 * 60);

    // ✅ Room expires 15 minutes AFTER lesson end
    const expSec = startSec + (duration * 60) + (15 * 60);

    console.log(`Creating Daily.co room: ${date} ${startTime}`);
    console.log(`  NBF (15 min before): ${new Date(nbfSec * 1000).toISOString()}`);
    console.log(`  EXP (15 min after end): ${new Date(expSec * 1000).toISOString()}`);

    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          nbf: Math.floor(nbfSec),  // NOT accessible before this time
          exp: Math.floor(expSec),   // Expires after this time
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      console.error('Daily.co API error:', data);
      throw new Error(data.error || 'Daily API error');
    }

    console.log('✅ Room created:', data.url);
    res.status(200).json({ url: data.url });
  } catch (err) {
    console.error('Daily.co error:', err.message);
    res.status(500).json({ error: 'Failed to create video room' });
  }
}
