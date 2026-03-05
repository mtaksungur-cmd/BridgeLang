import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  try {
    // Şikayetleri çek
    const snap = await adminDb.collection('complaints').get();
    const complaints = [];

    for (const docSnap of snap.docs) {
      const r = { id: docSnap.id, ...docSnap.data() };

      // öğretmen adı
      let teacherName = "—";
      if (r.teacherId) {
        const tSnap = await adminDb.collection('users').doc(r.teacherId).get();
        if (tSnap.exists) teacherName = tSnap.data().name || "—";
      }

      // öğrenci adı
      let studentName = "—";
      if (r.studentId) {
        const sSnap = await adminDb.collection('users').doc(r.studentId).get();
        if (sSnap.exists) studentName = sSnap.data().name || "—";
      } else if (r.role === "student" && r.userId) {
        // şikayeti yapan öğrenci
        const uSnap = await adminDb.collection('users').doc(r.userId).get();
        if (uSnap.exists) studentName = uSnap.data().name || "—";
      }

      complaints.push({
        ...r,
        teacherName,
        studentName,
      });
    }

    res.status(200).json(complaints);
  } catch (e) {
    console.error("Admin reports fetch failed:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
