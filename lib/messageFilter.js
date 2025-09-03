export const isInappropriate = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();

  // ---- Helpers ----
  const keywordVariants = (word) => {
    const chars = word.split('');
    return new RegExp(chars.map(c => `[\\s\\W_]*${c}`).join('') + '[\\s\\W_]*', 'i');
  };

  // Ayraçları silip, leet -> normalleştir (O/o→0, l→1, s→5)
  const normalizeDigits = (s) => {
    return s
      .replace(/[oO]/g, '0')
      .replace(/l/g, '1')
      .replace(/s/g, '5')
      .replace(/[\s\-\.\(\)\[\]_]/g, '');
  };

  // 10+ toplam rakam veya 7+ ardışık rakam var mı?
  const hasPhoneLikeDigits = (s) => {
    const onlyDigits = s.replace(/\D/g, '');
    if (onlyDigits.length >= 10) return true;
    if (/\d{7,}/.test(s.replace(/\D/g, (m) => m))) return true; // ardışık 7+
    return false;
  };

  // Yazıyla söylenen rakamları sayıya çevir (zero/oh/…; double/triple destekli)
  const wordsToNumberString = (s) => {
    const map = {
      'zero': '0', 'oh': '0', 'o': '0',
      'one': '1', 'two': '2', 'three': '3',
      'four': '4', 'for': '4', // “four/for” hilesi
      'five': '5', 'six': '6', 'seven': '7',
      'eight': '8', 'ate': '8', // “ate” hilesi
      'nine': '9'
    };
    const mult = { 'double': 2, 'triple': 3, 'quad': 4, 'quadruple': 4 };

    // sadece harfler ve boşlukları bırak
    const cleaned = s.toLowerCase().replace(/[^a-z\s]/g, ' ');
    const tokens = cleaned.split(/\s+/).filter(Boolean);

    let out = '';
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (mult[t] && map[tokens[i + 1]]) {
        out += map[tokens[i + 1]].repeat(mult[t]);
        i++;
        continue;
      }
      if (map[t]) out += map[t];
    }
    return out;
  };

  // ---- Phone heavy block rules ----
  const phoneTriggers = [
    /\btel:\s*/i,
    keywordVariants('phone'),
    keywordVariants('number'),
    keywordVariants('no'),
    keywordVariants('numara'),
    keywordVariants('call me'),
    keywordVariants('text me'),
    keywordVariants('message me'),
    keywordVariants('contact me'),
    keywordVariants('reach me'),
  ];

  // UK spesifik kalıplar & varyasyonlar
  const ukPhoneRegexes = [
    // +44 7xxx xxxxxx, 0044 7xxx xxxxxx, ( +44 ) 7..., 07xxx xxxxxx
    /\+44[\s\-\(\)]*7\d{2,3}[\s\-\(\)]*\d{3}[\s\-\(\)]*\d{3}/i,
    /00\s?44[\s\-\(\)]*7\d{2,3}[\s\-\(\)]*\d{3}[\s\-\(\)]*\d{3}/i,
    /\(\s*\+44\s*\)[\s\-\(\)]*7\d{2,3}[\s\-\(\)]*\d{3}[\s\-\(\)]*\d{3}/i,
    /\b0\s*7\d{2,3}[\s\-\(\)]*\d{3}[\s\-\(\)]*\d{3}\b/i,
    // (0)7xxx xxxxxx
    /\(\s*0\s*\)\s*7\d{2,3}[\s\-\(\)]*\d{3}[\s\-\(\)]*\d{3}/i,
  ];

  // Genel: uluslararası aşırı esnek — çok false positive istemiyorsan bu kalır,
  // biz “ağır koruma” istediğin için aktif tutuyoruz:
  const veryLooseIntl = /(\+?\d[\s\-\(\)]?){10,}/;

  // ---- E-posta / link / sosyal / whatsapp ----
  const bannedWords = [
    "fuck","shit","bitch","asshole","cunt","dick","pussy",
    "wanker","bollocks","twat","slag","prick","nigger","nigga","nigg"
  ];

  const regexes = [
    // Email
    /[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}/,

    // Linkler
    /https?:\/\//i,
    /www\./i,

    // WhatsApp ve muadilleri
    keywordVariants("whatsapp"),
    keywordVariants("wa.me"),
    keywordVariants("w.me"),

    // Sosyal
    keywordVariants("instagram"),
    keywordVariants("facebook"),
    keywordVariants("twitter"),
    keywordVariants("snapchat"),
    keywordVariants("tiktok"),
    keywordVariants("linkedin"),

    // Profanity
    ...bannedWords.map(keywordVariants),

    // Phone triggers (az rakam olsa bile)
    ...phoneTriggers,

    // UK phone kalıpları
    ...ukPhoneRegexes,

    // Çok gevşek uluslararası (10+ karakterlik numara denemeleri)
    veryLooseIntl,
  ];

  // 1) Kelime bazlı/regex bazlı hızlı tarama
  if (regexes.some((re) => re.test(lower))) return true;

  // 2) Leet-normalize + ayraçsız
  const normalized = normalizeDigits(lower);
  if (hasPhoneLikeDigits(normalized)) return true;

  // 3) Yazıyla yazılmış rakamları topla → 7+ ardışık ya da toplam 10+ rakam
  const spokenDigits = wordsToNumberString(lower);
  if (spokenDigits && (/\d{7,}/.test(spokenDigits) || spokenDigits.length >= 10)) return true;

  return false;
};
