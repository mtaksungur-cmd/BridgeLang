import { adminDb } from '../../../lib/firebaseAdmin';
import { isInappropriate } from '../../../lib/messageFilter';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    userId,
    review_type,
    rating,
    comment,
    user_consented,

    // Frontend’den gelen alanlar
    display_name,
    display_photo,

    // 🟩 ESKİ VERİYİ TUTAN ALANLAR (zorunlu)
    fullName,
    profilePhotoUrl,
  } = req.body;

  if (!userId || !rating || !review_type)
    return res.status(400).json({ error: 'Missing fields' });

  if (comment && isInappropriate(comment))
    return res.status(400).json({ error: 'Inappropriate content' });

  try {
    const ref = adminDb.collection('reviews').doc();

    await ref.set({
      id: ref.id,
      userId,
      review_type,
      rating,
      comment: comment || '',

      // 📌 RIZA DURUMU
      user_consented: !!user_consented,
      display_name,
      display_photo: display_photo || null,

      // 📌 ORİJİNAL VERİ (gerçek isim + foto)
      fullName: fullName || null,
      profilePhotoUrl: profilePhotoUrl || null,

      // 📌 Gizlilik / görünürlük kontrolleri
      hidden: false,

      // 📌 Tarih damgası
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({ ok: true, id: ref.id });

  } catch (err) {
    console.error('platform review error:', err);
    return res.status(500).json({ error: err.message });
  }
}
