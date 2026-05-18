import { idSlug } from './slugify';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://appofasi.gr';

export const EMBED_ENTITY_CONFIG = {
  polls: {
    defaultHeight: 620,
    fallbackTitle: 'Appofa poll embed',
  },
  suggestions: {
    defaultHeight: 540,
    fallbackTitle: 'Appofa suggestion embed',
  },
  'civic-questions': {
    defaultHeight: 620,
    fallbackTitle: 'Appofa civic question embed',
  },
};

export function parseEmbedEntityId(value) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function getEmbedPath(entityType, id, title = '') {
  const normalizedId = entityType === 'polls' ? idSlug(id, title) : String(id);
  return `/embed/${entityType}/${normalizedId}`;
}

export function getEmbedOpenPath(entityType, entity) {
  if (!entity?.id) return '/';
  if (entityType === 'polls') return `/polls/${idSlug(entity.id, entity.title)}`;
  if (entityType === 'suggestions') return `/suggestions/${entity.id}`;
  if (entityType === 'civic-questions') return `/civic-questions/${entity.id}`;
  return '/';
}

export function getAbsoluteEmbedUrl(path, origin) {
  const base = origin || SITE_URL;
  return new URL(path, base).toString();
}

function escapeHtmlAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildIframeEmbedCode({
  src,
  height,
  title,
  width = '100%',
}) {
  return `<iframe src="${escapeHtmlAttribute(src)}" width="${escapeHtmlAttribute(width)}" height="${escapeHtmlAttribute(height)}" style="border:0;width:100%;max-width:720px;border-radius:16px;overflow:hidden;" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" title="${escapeHtmlAttribute(title || 'Appofa embed')}"></iframe>`;
}
