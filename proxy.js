import { NextResponse } from 'next/server';
import { lookupCountryCodeByIp } from './lib/geo/proxyCountryDetection';

const SKIP_REDIRECT_PREFIXES = ['/_next/', '/api/', '/favicon', '/country', '/login', '/register', '/forgot-password', '/reset-password', '/static', '/blocked', '/unknown-country', '/admin'];
const ASSET_EXTENSION_REGEX = /\.(ico|png|jpg|svg|js|css|woff2?)$/i;
const RULES_CACHE_TTL = 60 * 1000;

const DEFAULT_ACCESS_RULES = {
  blockedCountries: [],
  blockedCountriesRedirects: new Map(),
  unknownCountryAction: 'allow',
  unknownCountryRedirectPath: '/unknown-country',
  noIpAction: 'allow',
  noIpRedirectPath: '/unknown-country',
};

let _rulesCache = null;
let _rulesCacheExpiry = 0;

const isSkippableForRedirect = (pathname) => (
  SKIP_REDIRECT_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || ASSET_EXTENSION_REGEX.test(pathname)
);

const normalizeCountryCode = (value) => {
  if (!value) return null;
  const code = String(value).toUpperCase().trim();
  if (!/^[A-Z]{2}$/.test(code) || code === 'XX' || code === 'T1') return null;
  return code;
};

const normalizeAction = (value) => (value === 'block' || value === 'redirect' || value === 'allow' ? value : 'allow');

const normalizeRedirectPath = (value, fallback = '/unknown-country') => {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim();
  if (!normalized.startsWith('/')) return fallback;
  return normalized || fallback;
};

const normalizeBlockedCountryRedirectPath = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized.startsWith('/')) return null;
  return normalized || null;
};

const getClientIp = (request) => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || null;
};

const normalizeAccessRules = (payload) => {
  const blockedEntries = Array.isArray(payload?.blockedCountries)
    ? payload.blockedCountries
      .map((entry) => {
        if (typeof entry === 'string') {
          const countryCode = normalizeCountryCode(entry);
          if (!countryCode) return null;
          return { countryCode, redirectPath: null };
        }
        const countryCode = normalizeCountryCode(entry?.countryCode);
        if (!countryCode) return null;
        return {
          countryCode,
          redirectPath: normalizeBlockedCountryRedirectPath(entry?.redirectPath),
        };
      })
      .filter(Boolean)
    : [];

  const blockedCountries = blockedEntries.map((entry) => entry.countryCode);
  const blockedCountriesRedirects = new Map(
    blockedEntries
      .filter((entry) => entry.redirectPath)
      .map((entry) => [entry.countryCode, entry.redirectPath])
  );

  return {
    blockedCountries,
    blockedCountriesRedirects,
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
    if (!response.ok) throw new Error('Failed to fetch access rules');
    const body = await response.json();
    _rulesCache = normalizeAccessRules(body?.data || {});
  } catch {
    _rulesCache = { ...DEFAULT_ACCESS_RULES, blockedCountries: [], blockedCountriesRedirects: new Map() };
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
  // Highest-priority: explicit country saved by the user (1-year cookie set when the user
  // clicks "Continue" on the country onboarding page or "Switch" in the mismatch banner)
  const userCountry = normalizeCountryCode(request.cookies.get('appofa_user_country')?.value);
  const shouldSkipRedirect = isSkippableForRedirect(pathname);
  const apiBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const ipAddress = getClientIp(request);
  let fallbackCountry = null;
  // userCountry takes priority over IP/header detection for routing decisions
  let countryCode = userCountry || headerCountry || cookieCountry;

  if (!shouldSkipRedirect && !countryCode && ipAddress) {
    fallbackCountry = await lookupCountryCodeByIp({ apiBase, ipAddress });
    if (fallbackCountry === 'GR') {
      countryCode = fallbackCountry;
    }
  }

  const withDetectedCountryCookie = (response) => {
    const detectedCountry = headerCountry || (fallbackCountry === 'GR' ? fallbackCountry : null);
    if (detectedCountry) {
      response.cookies.set('appofa_detected_country', detectedCountry, { path: '/', maxAge: 86400, sameSite: 'Lax' });
    }
    return response;
  };

  const nextResponse = () => {
    if (countryCode) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-detected-country', countryCode);
      return withDetectedCountryCookie(NextResponse.next({ request: { headers: requestHeaders } }));
    }
    return withDetectedCountryCookie(NextResponse.next());
  };

  if (shouldSkipRedirect) {
    return nextResponse();
  }

  const rules = await getAccessRules(apiBase);
  const blockedCountries = new Set(rules.blockedCountries || []);

  if (countryCode && blockedCountries.has(countryCode)) {
    const redirectPath = rules.blockedCountriesRedirects?.get(countryCode) || '/blocked';
    return withDetectedCountryCookie(NextResponse.redirect(new URL(redirectPath, request.url)));
  }

  if (!countryCode) {
    const action = ipAddress ? rules.unknownCountryAction : rules.noIpAction;
    const redirectPath = ipAddress ? rules.unknownCountryRedirectPath : rules.noIpRedirectPath;
    if (action === 'block') {
      return withDetectedCountryCookie(NextResponse.redirect(new URL('/blocked', request.url)));
    }
    if (action === 'redirect') {
      return withDetectedCountryCookie(NextResponse.redirect(new URL(normalizeRedirectPath(redirectPath), request.url)));
    }
  }

  // User has explicitly chosen a country — never override their choice with an auto-redirect
  if (userCountry) {
    return nextResponse();
  }

  if (request.cookies.get('appofa_country_visited')?.value) {
    return nextResponse();
  }

  if (!countryCode) {
    // No country signal at all — pass through; the non-GR filter below would be
    // a no-op here anyway since countryCode is falsy, but the explicit guard keeps
    // the intent readable.
    return nextResponse();
  }

  // Only redirect to onboarding pages for primary countries where we trust IP detection
  // enough to warrant an automatic first-visit redirect.  Non-listed IP detections are
  // treated as informational hints only and must not force users to a foreign country page.
  // Add codes here when the platform expands to additional primary countries (e.g. 'CY').
  const AUTO_REDIRECT_COUNTRIES = new Set(['GR']);
  if (!AUTO_REDIRECT_COUNTRIES.has(countryCode)) {
    return nextResponse();
  }

  const url = new URL(`/country/${countryCode}`, request.url);
  const response = NextResponse.redirect(url);
  response.cookies.set('appofa_country_visited', '1', { path: '/', maxAge: 86400, sameSite: 'Lax' });
  return withDetectedCountryCookie(response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
