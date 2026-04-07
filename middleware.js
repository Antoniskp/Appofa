import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './lib/i18n-config';

export default createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true // uses Accept-Language header on first visit
});

export const config = {
  // Match all paths except API routes, Next internals, and static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
