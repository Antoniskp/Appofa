import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['el', 'en'],
  defaultLocale: 'el',
  localeDetection: true
});

// Re-export for convenience
export const locales = routing.locales;
export const defaultLocale = routing.defaultLocale;
