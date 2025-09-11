import { DateTime } from 'luxon';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  const { date, startTime, duration, timezone } = req.body; 
  // dikkat: artık date + startTime + timezone de alıyoruz

  if (!duration || typeof duration !== 'number') {
    return res.status(400).json({ error: 'Missing or invalid duration' });
  }

  try {
    // Başlangıç saatini UTC’ye çevir
    const dt = DateTime.fromFormat(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm', { zone: timezone || 'UTC' });
    const startSec = dt.toSeconds();
    const expSec = startSec + duration * 60; // ders süresi kadar açık

    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          nbf: Math.floor(startSec), // odayı erken açma
          exp: Math.floor(expSec),   // dersten sonra kapanma
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      throw new Error(data.error || 'Daily API error');
    }

    res.status(200).json({ url: data.url });
  } catch (err) {
    console.error('Daily.co error:', err.message);
    res.status(500).json({ error: 'Failed to create video room' });
  }
}
