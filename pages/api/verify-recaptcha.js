export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Missing reCAPTCHA token' });
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;

  try {
    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secret}&response=${token}`
    });

    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed', errorCodes: data['error-codes'] });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error during reCAPTCHA verification' });
  }
}