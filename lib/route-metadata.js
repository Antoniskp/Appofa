import { getTranslations } from 'next-intl/server';
import { pageMetadata } from './seo';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const titleOnly = { alternates: null, description: null, openGraph: null, twitter: null };

export function MetadataLayout({ children }) {
  return children;
}

export function privatePageMetadata(titleKey) {
  return async () => {
    const t = await getTranslations();
    return {
      ...titleOnly,
      title: t(titleKey),
      robots: { index: false, follow: false },
    };
  };
}

export function memberPageMetadata(titleKey) {
  return async ({ params }) => {
    const [{ username }, t] = await Promise.all([params, getTranslations('metadata')]);
    return { ...titleOnly, title: t(titleKey, { username }) };
  };
}

export function adminPageMetadata(titleKey) {
  return async () => {
    const t = await getTranslations();
    return { title: `${t(titleKey)} · ${t('adminWorkspace.admin')}` };
  };
}

export function publicPageMetadata(titleKey, descriptionKey, path) {
  return async () => {
    const t = await getTranslations();
    return pageMetadata(t(titleKey), t(descriptionKey), path);
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
