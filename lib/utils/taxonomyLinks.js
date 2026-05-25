export function buildTaxonomyHref(basePath, key, value) {
  if (!basePath || !key || !value) return basePath;
  const params = new URLSearchParams({ [key]: String(value) });
  return `${basePath}?${params.toString()}`;
}

export function getArticleListPath(type) {
  const normalized = String(type || '').toLowerCase();
  if (normalized === 'news') return '/news';
  if (normalized === 'video') return '/videos';
  return '/articles';
}

export function getArticleTypeHref(type) {
  const normalized = String(type || '').toLowerCase();
  if (normalized === 'personal') {
    return buildTaxonomyHref('/articles', 'type', 'personal');
  }
  return getArticleListPath(normalized);
}
