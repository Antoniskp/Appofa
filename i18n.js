import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './lib/i18n-config';

export { locales, defaultLocale };

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default
}));
