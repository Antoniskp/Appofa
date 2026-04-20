import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './lib/constants/i18n.js';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || DEFAULT_LOCALE;
  const resolvedLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;

  return {
    locale: resolvedLocale,
    messages: (await import(`./messages/${resolvedLocale}.json`)).default,
  };
});
