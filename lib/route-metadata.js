import { getTranslations } from 'next-intl/server';
import { pageMetadata } from './seo';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const titleOnly = { alternates: null, description: null, openGraph: null, twitter: null };

// Next.js clears an inherited template when an intermediate layout sets a plain title.
function brandedTitle(title, brand) {
  return { absolute: `${title} | ${brand}`, template: `%s | ${brand}` };
}

export function MetadataLayout({ children }) {
  return children;
}

export function privatePageMetadata(titleKey) {
  return async () => {
    const t = await getTranslations();
    return {
      ...titleOnly,
      title: brandedTitle(t(titleKey), t('common.app_name')),
      robots: { index: false, follow: false },
    };
  };
}

export function memberPageMetadata(titleKey) {
  return async ({ params }) => {
    const [{ username }, t] = await Promise.all([params, getTranslations()]);
    return { ...titleOnly, title: brandedTitle(t(`metadata.${titleKey}`, { username }), t('common.app_name')) };
  };
}

export function adminPageMetadata(titleKey) {
  return async () => {
    const t = await getTranslations();
    const title = `${t(titleKey)} · ${t('adminWorkspace.admin')}`;
    return { title: brandedTitle(title, t('common.app_name')) };
  };
}

export function publicPageMetadata(titleKey, descriptionKey, path) {
  return async () => {
    const t = await getTranslations();
    const title = t(titleKey);
    return { ...pageMetadata(title, t(descriptionKey), path), title: brandedTitle(title, t('common.app_name')) };
  };
}

export function sectionMetadata(metadata) {
  return async () => {
    const t = await getTranslations('common');
    return { ...metadata, title: brandedTitle(metadata.title, t('app_name')) };
  };
}

export async function fetchPublicMetadata(path) {
  try {
    const response = await fetch(new URL(path, API_URL), {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}
