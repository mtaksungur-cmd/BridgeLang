import { adminDb } from "../../lib/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, type } = req.body;

  if (!userId || !type) return res.status(400).json({ error: "Missing userId or type" });

  // Hangi alanı düşüreceğiz?
  const fieldMap = {
    view: "viewLimit",
    message: "messagesLeft",
    credit: "credits"
  };

  const field = fieldMap[type];
  if (!field) return res.status(400).json({ error: "Invalid type" });

  try {
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) return res.status(404).json({ error: "User not found" });

    const current = userSnap.data()[field];

    // Sınırsız (null veya undefined) veya zaten 0 ise azaltma!
    if (current === null || current === undefined || current <= 0) {
      return res.status(200).json({ [field]: current ?? 0 });
    }

    await userRef.update({ [field]: current - 1 });
    res.status(200).json({ [field]: current - 1 });
  } catch (err) {
    console.error("Decrement error:", err);
    res.status(500).json({ error: "Could not decrement " + field });
  }
}