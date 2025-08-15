import { adminDb } from '../../../lib/firebaseAdmin';
import { DateTime } from 'luxon';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const {
      teacherId,
      studentId,
      date,
      startTime,
      endTime,
      duration,
      location,
      meetingLink
    } = req.body;

    if (!teacherId || !studentId || !date || !startTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 🔹 TR saatine göre UTC hesapla
    const startAtUtc = DateTime.fromFormat(
      `${date} ${startTime}`,
      'yyyy-MM-dd hh:mm a',
      { zone: 'Europe/Istanbul' } // Test sürecinde TR
    ).toUTC().toMillis();

    await adminDb.collection('bookings').add({
      teacherId,
      studentId,
      date,
      startTime,
      endTime,
      duration,
      location,
      meetingLink: meetingLink || '',
      amountPaid: null,
      status: 'pending-approval',
      teacherApproved: false,
      studentConfirmed: false,
      reminderSent: false,
      startAtUtc,
      createdAt: new Date(),
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Booking create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}