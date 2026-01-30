import { adminDb } from '../../../lib/firebaseAdmin';
import { isInappropriate } from '../../../lib/messageFilter';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  let {
    userId,
    review_type,
    rating,
    comment,
    user_consented,

    // Frontend’den gelen alanlar
    display_name,
    display_photo,

    // 🟩 Orijinal veriler (zorunlu)
    fullName,
    profilePhotoUrl,
  } = req.body;

  if (!userId || !rating || !review_type)
    return res.status(400).json({ error: 'Missing fields' });

  let cleanComment = (comment || "")
    .normalize("NFKC")
    .replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, "") 
    .replace(/\u2028|\u2029/g, "")
    .trim();

  // Filtreyi temiz yorum üzerinde çalıştır
  if (cleanComment && isInappropriate(cleanComment)) {
    return res.status(400).json({ error: 'Inappropriate content' });
  }

  // DB'ye temiz hali yazılacak
  comment = cleanComment;

  try {
    const ref = adminDb.collection('reviews').doc();

    await ref.set({
      id: ref.id,
      userId,
      review_type,
      rating,
      comment: comment || '',

      user_consented: !!user_consented,
      display_name,
      display_photo: display_photo || null,

      fullName: fullName || null,
      profilePhotoUrl: profilePhotoUrl || null,

      hidden: false,
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({ ok: true, id: ref.id });
  } catch (err) {
    console.error('platform review error:', err);
    return res.status(500).json({ error: err.message });
  }
}
