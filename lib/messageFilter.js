export const isInappropriate = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();

  /* ---------------- HELPERS ---------------- */

  // Harfler arasına boşluk / sembol girilse bile yakalar
  const keywordVariants = (word) => {
    const chars = word.split('');
    return new RegExp(chars.map(c => `[\\s\\W_]*${c}`).join('') + '[\\s\\W_]*', 'i');
  };

  // Leet + ayraç temizleme
  const normalizeDigits = (s) =>
    s
      .replace(/[oO]/g, '0')
      .replace(/l/g, '1')
      .replace(/s/g, '5')
      .replace(/[\s\-\.\(\)\[\]_]/g, '');

  // Telefon benzeri rakam yoğunluğu
  const hasPhoneLikeDigits = (s) => {
    const digits = s.replace(/\D/g, '');
    if (digits.length >= 10) return true;
    if (/\d{7,}/.test(digits)) return true;
    return false;
  };

  // Yazıyla yazılan rakamlar (one two double three vs.)
  const wordsToNumberString = (s) => {
    const map = {
      zero: '0', oh: '0',
      one: '1', two: '2', three: '3',
      four: '4', for: '4',
      five: '5', six: '6', seven: '7',
      eight: '8', ate: '8',
      nine: '9',
    };
    const mult = { double: 2, triple: 3, quad: 4, quadruple: 4 };

    const tokens = s.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/);
    let out = '';

    for (let i = 0; i < tokens.length; i++) {
      if (mult[tokens[i]] && map[tokens[i + 1]]) {
        out += map[tokens[i + 1]].repeat(mult[tokens[i]]);
        i++;
        continue;
      }
      if (map[tokens[i]]) out += map[tokens[i]];
    }
    return out;
  };

  /* ---------------- PROFANITY ---------------- */

  const bannedWords = [
    "fuck","shit","bitch","asshole","cunt","dick","pussy",
    "wanker","bollocks","twat","slag","prick","nigger","nigga","nigg"
  ];

  /* ---------------- CONTACT / COMMUNICATION ---------------- */

  const contactRegexes = [
    // Email
    /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i,

    // URL / link
    /https?:\/\//i,
    /www\./i,

    // Sosyal / mesajlaşma
    keywordVariants("whatsapp"),
    keywordVariants("wa.me"),
    keywordVariants("telegram"),
    keywordVariants("t.me"),
    keywordVariants("instagram"),
    keywordVariants("facebook"),
    keywordVariants("snapchat"),
    keywordVariants("tiktok"),
    keywordVariants("linkedin"),

    // Açık iletişim çağrıları (DİKKAT: 'no' / 'number' YOK)
    /\bphone\s*number\b/i,
    /\bcall\s+me\b/i,
    /\btext\s+me\b/i,
    /\bmessage\s+me\b/i,
    /\bcontact\s+me\b/i,
    /\breach\s+me\b/i,

    // UK telefon formatları
    /\+44[\s\-()]*7\d{2,3}[\s\-()]*\d{3}[\s\-()]*\d{3}/i,
    /\b0\s*7\d{2,3}[\s\-()]*\d{3}[\s\-()]*\d{3}\b/i,

    // Çok gevşek ama rakam şartlı (en son)
    /(\+?\d[\s\-()]?){10,}/
  ];

  /* ---------------- QUICK SCAN ---------------- */

  if (bannedWords.some(w => keywordVariants(w).test(lower))) return true;
  if (contactRegexes.some(re => re.test(lower))) return true;

  /* ---------------- DIGIT ANALYSIS ---------------- */

  const normalized = normalizeDigits(lower);
  if (hasPhoneLikeDigits(normalized)) return true;

  const spoken = wordsToNumberString(lower);
  if (spoken && (spoken.length >= 10 || /\d{7,}/.test(spoken))) return true;

  return false;
};
