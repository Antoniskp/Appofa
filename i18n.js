import { getRequestConfig } from 'next-intl/server';

export const locales = ['el', 'en'];
export const defaultLocale = 'el';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default
}));
