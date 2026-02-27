import { adminDb } from "../../lib/firebaseAdmin";
import { PLAN_LIMITS } from "../../lib/planLimits";

export default async function handler(req, res) {
  console.log('📉 DECREMENT REQUEST:', req.body);
  if (req.method !== "POST") return res.status(405).end();

  const { userId, type } = req.body;

  if (!userId || !type) return res.status(400).json({ error: "Missing userId or type" });

  // Profile views are unlimited for all plans — skip decrement
  if (type === "view") {
    return res.status(200).json({ viewLimit: 9999 });
  }

  const fieldMap = {
    message: "messagesLeft",
    credit: "credits"
  };

  const field = fieldMap[type];
  if (!field) return res.status(400).json({ error: "Invalid type" });

  try {
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) return res.status(404).json({ error: "User not found" });

    const udata = userSnap.data();
    let current = udata[field];

    const planKey = (udata.subscriptionPlan || "free").toLowerCase();

    if (current === undefined || current === null) {
      current = PLAN_LIMITS[planKey]?.[field] ?? 0;
    }

    if (current <= 0 || current >= 9999 || planKey === "vip") {
      return res.status(200).json({ [field]: current });
    }

    await userRef.update({ [field]: current - 1 });
    res.status(200).json({ [field]: current - 1 });
  } catch (err) {
    console.error("Decrement error:", err);
    res.status(500).json({ error: "Could not decrement " + field });
  }
}