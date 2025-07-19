export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  const { duration } = req.body; // dakika cinsinden bekleniyor

  if (!duration || typeof duration !== 'number') {
    return res.status(400).json({ error: 'Missing or invalid duration' });
  }

  try {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const exp = nowInSeconds + duration * 60; // dakika → saniye

    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          exp,
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
