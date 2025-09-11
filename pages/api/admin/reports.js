// pages/api/admin/reports.js
import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  try {
    const snap = await adminDb.collection('complaints').get();
    const complaints = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(complaints);
  } catch (e) {
    console.error("Admin reports fetch failed:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
