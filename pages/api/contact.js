import nodemailer from "nodemailer";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // multipart için kapat
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const form = formidable({ multiples: false, maxFileSize: 10 * 1024 * 1024 }); // 10MB
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, flds, fls) => (err ? reject(err) : resolve({ fields: flds, files: fls })));
    });

    const name = String(fields.name || "").trim();
    const email = String(fields.email || "").trim();
    const subject = String(fields.subject || "").trim();
    const message = String(fields.message || "").trim();

    // Basit doğrulama
    if (!name || !email || !message || message.length < 20) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    // Transporter (ENV’den)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: !!process.env.SMTP_SECURE, // "true" ise TLS
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });

    const to = process.env.CONTACT_TO || "contact@bridgelang.co.uk";

    // Attachment varsa hazırla
    let attachments = [];
    const f = files?.attachment;
    if (f && f.filepath) {
      attachments.push({
        filename: f.originalFilename || "attachment",
        content: fs.createReadStream(f.filepath),
        contentType: f.mimetype || "application/octet-stream",
      });
    }

    const mail = {
      from: process.env.CONTACT_FROM || `"BridgeLang Contact" <no-reply@bridgelang.co.uk>`,
      to,
      subject: `[Contact] ${subject || "New Message"} – ${name}`,
      replyTo: email,
      text:
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Subject: ${subject || "(none)"}\n\n` +
        `Message:\n${message}\n`,
      html: `
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject || "(none)")}</p>
        <hr/>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      `,
      attachments,
    };

    await transporter.sendMail(mail);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("contact api error:", err);
    return res.status(500).json({ error: "Failed to send" });
  }
}

function escapeHtml(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
