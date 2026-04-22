import { NextResponse } from 'next/server';

const SKIP_PREFIXES = ['/_next/', '/api/', '/favicon', '/country', '/login', '/register', '/static', '/blocked', '/unknown-country', '/admin'];
const ASSET_EXTENSION_REGEX = /\.(ico|png|jpg|svg|js|css|woff2?)$/i;
const RULES_CACHE_TTL = 60 * 1000;

const DEFAULT_ACCESS_RULES = {
  blockedCountries: [],
  unknownCountryAction: 'allow',
  unknownCountryRedirectPath: '/unknown-country',
  noIpAction: 'allow',
  noIpRedirectPath: '/unknown-country',
};

let _rulesCache = null;
let _rulesCacheExpiry = 0;

const isSkippablePath = (pathname) => (
  SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || ASSET_EXTENSION_REGEX.test(pathname)
);

const normalizeCountryCode = (value) => {
  if (!value) return null;
  const code = String(value).toUpperCase().trim();
  if (!/^[A-Z]{2}$/.test(code) || code === 'XX' || code === 'T1') return null;
  return code;
};

const normalizeIpForTracking = (ip) => {
  if (!ip) return null;
  const mapped = ip.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  return mapped ? mapped[1] : ip;
};

const normalizeAction = (value) => (value === 'block' || value === 'redirect' || value === 'allow' ? value : 'allow');

const normalizeRedirectPath = (value, fallback = '/unknown-country') => {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim();
  if (!normalized.startsWith('/')) return fallback;
  return normalized || fallback;
};

const getClientIp = (request) => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || null;
};

const normalizeAccessRules = (payload) => {
  const blockedCountries = Array.isArray(payload?.blockedCountries)
    ? payload.blockedCountries
      .map((code) => normalizeCountryCode(code))
      .filter(Boolean)
    : [];

  return {
    blockedCountries,
    unknownCountryAction: normalizeAction(payload?.unknownCountryAction),
    unknownCountryRedirectPath: normalizeRedirectPath(payload?.unknownCountryRedirectPath),
    noIpAction: normalizeAction(payload?.noIpAction),
    noIpRedirectPath: normalizeRedirectPath(payload?.noIpRedirectPath),
  };
};

const getAccessRules = async (apiBase) => {
  if (_rulesCache && Date.now() < _rulesCacheExpiry) {
    return _rulesCache;
  }

  try {
    const response = await fetch(`${apiBase}/api/geo/access-rules`);
    if (!response.ok) {
      throw new Error('Failed to fetch access rules');
    }
    const body = await response.json();
    _rulesCache = normalizeAccessRules(body?.data || {});
  } catch {
    _rulesCache = { ...DEFAULT_ACCESS_RULES };
  }

  _rulesCacheExpiry = Date.now() + RULES_CACHE_TTL;
  return _rulesCache;
};

export const resetAccessRulesCacheForTests = () => {
  _rulesCache = null;
  _rulesCacheExpiry = 0;
};

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const headerCountry = normalizeCountryCode(request.headers.get('CF-IPCountry'));
  const cookieCountry = normalizeCountryCode(request.cookies.get('appofa_detected_country')?.value);
  const countryCode = headerCountry || cookieCountry;

  const nextResponse = () => {
    if (headerCountry) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-detected-country', headerCountry);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    return NextResponse.next();
  };

  if (isSkippablePath(pathname)) {
    return nextResponse();
  }

  const apiBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const ipAddress = normalizeIpForTracking(getClientIp(request));
  const locale = request.cookies.get('NEXT_LOCALE')?.value || null;

  fetch(`${apiBase}/api/geo/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: pathname, countryCode: countryCode || null, ipAddress, locale }),
  }).catch(() => {});

  const rules = await getAccessRules(apiBase);
  const blockedCountries = new Set(rules.blockedCountries || []);

  if (countryCode && blockedCountries.has(countryCode)) {
    return NextResponse.redirect(new URL('/blocked', request.url));
  }

  if (!countryCode) {
    const action = ipAddress ? rules.unknownCountryAction : rules.noIpAction;
    const redirectPath = ipAddress ? rules.unknownCountryRedirectPath : rules.noIpRedirectPath;

    if (action === 'block') {
      return NextResponse.redirect(new URL('/blocked', request.url));
    }
    if (action === 'redirect') {
      return NextResponse.redirect(new URL(normalizeRedirectPath(redirectPath), request.url));
    }
  }

  if (request.cookies.get('appofa_country_visited')?.value) {
    return nextResponse();
  }

  if (!countryCode) {
    return nextResponse();
  }

  const url = new URL(`/country/${countryCode}`, request.url);
  const response = NextResponse.redirect(url);
  response.cookies.set('appofa_country_visited', '1', { path: '/', maxAge: 86400, sameSite: 'Lax' });
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
