const GEO_DETECT_TIMEOUT_MS = 1500;

const normalizeCountryCode = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized) || normalized === 'XX' || normalized === 'T1') {
    return null;
  }
  return normalized;
};

export async function lookupCountryCodeByIp({ apiBase, ipAddress }) {
  if (!apiBase || !ipAddress) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEO_DETECT_TIMEOUT_MS);

  try {
    const headers = new Headers();
    headers.set('x-forwarded-for', ipAddress);
    headers.set('x-real-ip', ipAddress);

    const response = await fetch(`${apiBase}/api/geo/detect`, {
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const body = await response.json();
    return normalizeCountryCode(body?.data?.countryCode);
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
