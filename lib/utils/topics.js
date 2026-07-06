import { slugify } from './slugify';

export function topicHref(tag) {
  const slug = slugify(String(tag || ''));
  return slug ? `/topics/${encodeURIComponent(slug)}` : '/topics';
}
