import { getLocale, getTranslations } from 'next-intl/server';
import { MetadataLayout } from '@/lib/route-metadata';
import { isValidCountryCode } from '@/lib/geo/countryResolver';

export async function generateMetadata({ params }) {
  const [{ code }, locale, t] = await Promise.all([params, getLocale(), getTranslations('metadata')]);
  if (!isValidCountryCode(code)) return { title: t('unknownCountry') };

  const country = new Intl.DisplayNames(locale, { type: 'region' }).of(code.toUpperCase());
  return { title: t('countryEdition', { country }) };
}

export default MetadataLayout;
