import { adminDb } from '../../../lib/firebaseAdmin';
import { sendMail } from '../../../lib/mailer';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { chatId, senderId, text, role } = req.body;
  if (!chatId || !senderId || !text || !role)
    return res.status(400).json({ error: 'Missing fields' });

  try {
    const chatSnap = await adminDb.collection('chats').doc(chatId).get();
    if (!chatSnap.exists) return res.status(404).json({ error: 'Chat not found' });
    const chat = chatSnap.data();

    const teacherSnap = await adminDb.collection('users').doc(chat.teacherId).get();
    const studentSnap = await adminDb.collection('users').doc(chat.studentId).get();
    const teacher = teacherSnap.data() || {};
    const student = studentSnap.data() || {};

    const isFromStudent = role === 'student';
    const recipient = isFromStudent ? teacher : student;
    const sender = isFromStudent ? student : teacher;
    const chatUrl = isFromStudent
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/teacher/chats/${chatId}`
      : `${process.env.NEXT_PUBLIC_BASE_URL}/student/chats/${chatId}`;

    const preview = text.length > 400 ? text.slice(0, 400) + '...' : text;

    // 🔹 Kullanıcının e-posta bildirim tercihini kontrol et
    if (recipient.emailNotifications !== false) {
      await sendMail({
        to: recipient.email,
        subject: `💬 New message from ${sender.name || 'BridgeLang user'}`,
        html: `
          <p>Hi ${recipient.name || 'there'},</p>
          <p>You’ve received a new message from <b>${sender.name || 'BridgeLang user'}</b>:</p>
          <blockquote style="border-left:4px solid #2563eb;padding-left:12px;color:#333">
            ${preview}
          </blockquote>
          <p>
            <a href="${chatUrl}"
               style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px"
               target="_blank" rel="noopener">
               💬 Open Chat
            </a>
          </p>
          <p>BridgeLang Team</p>
        `,
      });
    } else {
      console.log(`📭 Skipped message mail — ${recipient.email} disabled notifications`);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('notifyMessage error:', e);
    return res.status(500).json({ error: e.message });
  }
}
