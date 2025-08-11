export const isInappropriate = (text) => {
  if (!text) return false;

  const lower = text.toLowerCase();

  const keywordVariants = (word) => {
    const chars = word.split('');
    return new RegExp(chars.map(c => `[\\s\\W_]*${c}`).join('') + '[\\s\\W_]*', 'i');
  };

  const regexes = [
    // Email addresses
    /[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}/,

    // UK Phone numbers: +44 7XXX XXXXXX or 07XXX XXXXXX
    /\+44\s?7\d{3}[\s\-]?\d{6}/,
    /\b07\d{3}[\s\-]?\d{6}\b/,

    // WhatsApp and obfuscated forms
    keywordVariants("whatsapp"),
    keywordVariants("wa.me"),
    keywordVariants("w.me"),

    // Links
    /https?:\/\//i,
    /www\./i,

    // Social media
    keywordVariants("instagram"),
    keywordVariants("facebook"),
    keywordVariants("twitter"),
    keywordVariants("snapchat"),
    keywordVariants("tiktok"),
    keywordVariants("linkedin"),

    // English profanity (expanded)
    /fuck|shit|bitch|asshole|cunt|dick|pussy|wank(er)?|bollocks|twat|slag|prick|nigg[aer]/,
    keywordVariants("fuck"),
    keywordVariants("shit"),
    keywordVariants("bitch"),
    keywordVariants("cunt"),
    keywordVariants("dick"),
    keywordVariants("pussy"),
    keywordVariants("wanker"),
    keywordVariants("bollocks"),
    keywordVariants("twat"),
    keywordVariants("prick"),
  ];

  return regexes.some((re) => re.test(lower));
};
