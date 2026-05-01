function normalizeCountryCode(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim().toUpperCase();
  return normalized || null;
}

function buildAllowedCountryCodeSet(allowedCountryCodes) {
  if (!Array.isArray(allowedCountryCodes) || allowedCountryCodes.length === 0) {
    return null;
  }
  const values = allowedCountryCodes
    .map((code) => normalizeCountryCode(code))
    .filter(Boolean);
  return values.length > 0 ? new Set(values) : null;
}

function findCountryCodeFromHomeLocation(homeLocation) {
  let current = homeLocation || null;
  let depth = 0;
  while (current && depth < 12) {
    const type = normalizeCountryCode(current.type);
    const code = normalizeCountryCode(current.code);
    if (type === 'COUNTRY' && code) return code;
    current = current.parent || null;
    depth += 1;
  }
  return null;
}

export function resolveUserDreamTeamCountryCode(user, options = {}) {
  if (!user || typeof user !== 'object') return null;

  const allowedSet = buildAllowedCountryCodeSet(options.allowedCountryCodes);
  const toAllowed = (code) => {
    const normalized = normalizeCountryCode(code);
    if (!normalized) return null;
    if (!allowedSet) return normalized;
    return allowedSet.has(normalized) ? normalized : null;
  };

  const fromNationality = toAllowed(user.nationality);
  if (fromNationality) return fromNationality;

  const fromHomeLocation = toAllowed(findCountryCodeFromHomeLocation(user.homeLocation));
  if (fromHomeLocation) return fromHomeLocation;

  return null;
}

export { normalizeCountryCode };
