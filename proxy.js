import { NextResponse } from 'next/server';

const SKIP_PREFIXES = [
  '/_next/',
  '/api/',
  '/favicon',
  '/country',
  '/login',
  '/register',
  '/static',
];

const ASSET_EXTENSION_REGEX = /\.(ico|png|jpg|svg|js|css|woff2?)$/i;

const isSkippablePath = (pathname) => (
  SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  || ASSET_EXTENSION_REGEX.test(pathname)
);

const normalizeCountryCode = (value) => {
  if (!value) return null;
  const code = String(value).toUpperCase().trim();
  if (!/^[A-Z]{2}$/.test(code) || code === 'XX' || code === 'T1') return null;
  return code;
};

const extractIpv4FromMapped = (ip) => {
  if (!ip) return null;
  const mapped = ip.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  return mapped ? mapped[1] : ip;
};

const getClientIp = (request) => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || null;
};

export function proxy(request) {
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

  // Fire-and-forget geo tracking for page views
  const apiBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const ipAddress = extractIpv4FromMapped(getClientIp(request));
  const locale = request.cookies.get('NEXT_LOCALE')?.value || null;

  fetch(`${apiBase}/api/geo/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: pathname,
      countryCode: countryCode || null,
      ipAddress,
      locale,
    }),
  }).catch(() => {
    // Silently ignore — tracking is non-critical
  });

  if (request.cookies.get('appofa_country_visited')?.value) {
    return nextResponse();
  }

  if (!countryCode) {
    return nextResponse();
  }

  const url = new URL(`/country/${countryCode}`, request.url);
  const response = NextResponse.redirect(url);
  response.cookies.set('appofa_country_visited', '1', {
    path: '/',
    maxAge: 86400,
    sameSite: 'Lax',
  });
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
