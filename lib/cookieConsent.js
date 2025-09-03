const CONSENT_KEY = 'bl_cookie_consent_v2025-09-10'; // version bump ile re-prompt
const DAYS = 180;

export const defaultState = {
  necessary: true,          // kapatılamaz
  functional: false,
  analytics: false,
  advertising: false,
  timestamp: null,
};

export function loadConsent() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data;
  } catch { return null; }
}

export function saveConsent(state) {
  if (typeof window === 'undefined') return;
  const payload = { ...state, timestamp: Date.now() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
  // first‑party cookie (opsiyonel, sadece presence için)
  document.cookie = `bl_consent=1; Max-Age=${60*60*24*DAYS}; Path=/; SameSite=Lax`;
}

export function hasConsent() {
  const data = loadConsent();
  return !!data;
}

export function allow(category) {
  const data = loadConsent();
  return !!data && !!data[category];
}
