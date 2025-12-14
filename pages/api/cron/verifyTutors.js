// pages/api/cron/verifyTutors.js
import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    // 1) Approved olan tüm öğretmenleri çek
    const snap = await adminDb
      .collection("users")
      .where("role", "==", "teacher")
      .where("status", "==", "approved")
      .get();

    if (snap.empty) {
      return res.status(200).json({
        ok: true,
        updated: 0,
        message: "No approved teachers found."
      });
    }

    const batch = adminDb.batch();
    let updatedCount = 0;

    snap.forEach((docSnap) => {
      const data = docSnap.data();

      // verified alanı yoksa veya false ise güncelle
      if (data.verified !== true) {
        batch.update(docSnap.ref, {
          verified: true,
          verifiedAt: new Date().toISOString()
        });
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
    }

    return res.status(200).json({
      ok: true,
      updated: updatedCount,
      message: `Verified flag added to ${updatedCount} teachers.`
    });

  } catch (err) {
    console.error("verifyTutors cron error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
