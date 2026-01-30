// pages/api/parent-consent.js
import { adminDb } from '../../lib/firebaseAdmin';
import { sendMail } from '../../lib/mailer';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { studentId, studentName, parentName, parentEmail, dob } = req.body;

  if (!studentId || !parentEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const token = crypto.randomBytes(20).toString('hex');
  const expireAt = Date.now() + 48 * 60 * 60 * 1000; // 48 saat

  await adminDb.collection('parentConsents').doc(studentId).set({
    studentId,
    studentName,
    parentName,
    parentEmail,
    dob,
    token,
    expireAt,
    confirmed: false,
    createdAt: Date.now(),
  });

  const confirmUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/parent-confirm?token=${token}&sid=${studentId}`;

  const subject = '⚠️ Action Required: Confirm Parental Consent for BridgeLang Registration';
  const html = `
    <p>Dear ${parentName || 'Parent/Guardian'},</p>
    <p>Your child, <b>${studentName}</b>, has registered for a BridgeLang account. Since they are under 18, we require your explicit consent before their account can be activated.</p>
    <p>Please review our <a href="${process.env.NEXT_PUBLIC_BASE_URL}/terms">Terms of Use</a> and <a href="${process.env.NEXT_PUBLIC_BASE_URL}/privacy">Privacy Policy</a> before confirming.</p>
    <p><a href="${confirmUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">✅ Confirm Consent</a></p>
    <p>Without your confirmation, your child will not be able to access our services.</p>
    <p>Thank you,<br/>BridgeLang Support Team</p>
  `;

  await sendMail({ to: parentEmail, subject, html, text: '' });

  res.json({ ok: true });
}
