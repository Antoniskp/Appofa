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

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const headerCountry = normalizeCountryCode(request.headers.get('CF-IPCountry'));
  const nextResponse = () => {
    const response = NextResponse.next();
    if (headerCountry) {
      response.headers.set('x-detected-country', headerCountry);
    }
    return response;
  };

  if (isSkippablePath(pathname)) {
    return nextResponse();
  }

  if (request.cookies.get('appofa_country_visited')?.value) {
    return nextResponse();
  }

  const cookieCountry = normalizeCountryCode(request.cookies.get('appofa_detected_country')?.value);
  const countryCode = headerCountry || cookieCountry;

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
