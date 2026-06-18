/**
 * Client-side country resolution utility.
 *
 * Implements a deterministic priority chain so the user's explicit choice
 * always wins over unreliable IP-based detection:
 *
 *   1. Saved user choice   (appofa_user_country cookie — 1-year, explicit)
 *   2. Profile location    (authenticated user's homeLocation country)
 *   3. Browser locale      (navigator.language, e.g. el-GR → GR)
 *   4. Browser timezone    (e.g. Europe/Athens → GR)
 *   5. IP hint             (appofa_detected_country cookie — 24-hour, informational)
 */

const ISO2_RE = /^[A-Z]{2}$/;
const INVALID_CODES = new Set(['XX', 'T1']);

const normalizeCode = (value) => {
  if (!value) return null;
  const upper = String(value).trim().toUpperCase();
  if (!ISO2_RE.test(upper) || INVALID_CODES.has(upper)) return null;
  return upper;
};

/** Read a named cookie value from document.cookie (client-side only). */
const readCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const eqIdx = cookie.indexOf('=');
    if (eqIdx === -1) continue;
    const key = cookie.slice(0, eqIdx).trim();
    if (key === name) {
      try {
        return decodeURIComponent(cookie.slice(eqIdx + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
};

/**
 * Return true when `value` is a valid, non-reserved ISO-3166-1 alpha-2 code.
 * Exported so callers can validate codes without importing the full resolver.
 */
export const isValidCountryCode = (value) => Boolean(normalizeCode(value));


export const getSavedUserCountry = () => normalizeCode(readCookie('appofa_user_country'));

/**
 * Persist the user's explicit country choice for 1 year.
 * This takes highest priority on subsequent page loads.
 */
export const saveUserCountry = (code) => {
  const normalized = normalizeCode(code);
  if (!normalized) return;
  if (typeof document !== 'undefined') {
    document.cookie = `appofa_user_country=${normalized}; path=/; max-age=31536000; SameSite=Lax`;
  }
};

/**
 * Return the IP-detected country hint from the `appofa_detected_country` cookie.
 * This is informational only — should never override an explicit user choice.
 */
export const getDetectedCountry = () => normalizeCode(readCookie('appofa_detected_country'));

/**
 * Derive a country code from the browser's navigator.language (e.g. el-GR → GR).
 * Returns null when running server-side or when no country tag is present.
 */
export const getBrowserLocaleCountry = () => {
  if (typeof navigator === 'undefined') return null;
  const locale =
    navigator.language ||
    (Array.isArray(navigator.languages) && navigator.languages[0]) ||
    null;
  if (!locale || !locale.includes('-')) return null;
  const tag = locale.split('-')[1]?.toUpperCase() || null;
  return normalizeCode(tag);
};

/**
 * Simple IANA timezone → ISO-3166-1 alpha-2 mapping.
 *
 * This map is intentionally minimal — it covers only the timezones relevant
 * to the Greek civic platform (Greece and Cyprus).  It is NOT intended to be
 * a comprehensive global timezone-to-country database; use a dedicated library
 * for that if broader coverage is ever required.
 *
 * Greece has a single IANA timezone (`Europe/Athens`), so no disambiguation
 * between multiple Greek timezones is needed.  Cyprus maps two IANA aliases
 * (`Asia/Nicosia` / `Europe/Nicosia`) to `CY` for full coverage.
 *
 * When adding new entries, limit them to countries where the platform has
 * localised content and an active user base.  Each entry should map a unique
 * IANA timezone to a single unambiguous ISO-2 country code.
 */
const TZ_COUNTRY_MAP = {
  'Europe/Athens': 'GR',
  'Asia/Nicosia': 'CY',
  'Europe/Nicosia': 'CY',
};

/**
 * Derive a country code from the browser's timezone (best-effort, limited coverage).
 * Returns null when running server-side or when the timezone is unknown.
 */
export const getTimezoneCountry = () => {
  try {
    if (typeof Intl === 'undefined') return null;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TZ_COUNTRY_MAP[tz] || null;
  } catch {
    return null;
  }
};

/**
 * Resolve the best country code using the priority chain described at the top
 * of this module.
 *
 * @param {object} [opts]
 * @param {object|null} [opts.user]         - Auth user object (may have homeLocation)
 * @param {string|null} [opts.queryCountry] - Explicit country from URL query param
 * @returns {{ code: string|null, source: string }}
 */
export const resolveCountry = ({ user = null, queryCountry = null } = {}) => {
  // 1. Saved user choice (explicit, highest priority)
  const saved = getSavedUserCountry();
  if (saved) return { code: saved, source: 'saved_choice' };

  // 2. Profile location (authenticated user)
  if (user?.homeLocation?.type === 'country') {
    const code = normalizeCode(user.homeLocation.code);
    if (code) return { code, source: 'profile' };
  }

  // 3. Explicit query parameter override
  const query = normalizeCode(queryCountry);
  if (query) return { code: query, source: 'query_param' };

  // 4. Browser signals (locale + timezone; prefer when both agree)
  const locale = getBrowserLocaleCountry();
  const tz = getTimezoneCountry();
  if (locale && tz && locale === tz) return { code: locale, source: 'browser_signals' };
  if (locale) return { code: locale, source: 'browser_locale' };
  if (tz) return { code: tz, source: 'browser_timezone' };

  // 5. IP hint (lowest priority — informational only)
  const detected = getDetectedCountry();
  if (detected) return { code: detected, source: 'ip_hint' };

  return { code: null, source: 'unknown' };
};
