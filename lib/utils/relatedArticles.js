const normalize = (value) => typeof value === 'string' ? value.trim().toLowerCase() : '';
const tagsOf = (article) => [...new Set((Array.isArray(article.tags) ? article.tags : []).map(normalize).filter(Boolean))];

export function selectRelatedArticles(article, candidates, limit = 4) {
  return rankRelated(article, candidates, limit, (candidate) => candidate.status === 'published'
    && (candidate.type !== 'news' || Boolean(candidate.newsApprovedAt)));
}

export function selectRelatedPolls(poll, candidates, limit = 4, now = Date.now()) {
  return rankRelated(poll, candidates, limit, (candidate) => candidate.status === 'active'
    && candidate.visibility === 'public'
    && (!candidate.deadline || Date.parse(candidate.deadline) > now));
}

function rankRelated(article, candidates, limit, eligible) {
  const tags = new Set(tagsOf(article));
  const category = normalize(article.category);
  const seen = new Set([String(article.id)]);
  const score = (candidate) => tagsOf(candidate).filter((tag) => tags.has(tag)).length * 3
    + (category && normalize(candidate.category) === category ? 2 : 0);
  const date = (candidate) => Date.parse(candidate.publishedAt || candidate.createdAt) || 0;

  return candidates.filter((candidate) => {
    if (!candidate?.id || seen.has(String(candidate.id)) || !eligible(candidate)) return false;
    seen.add(String(candidate.id));
    return true;
  }).sort((a, b) => score(b) - score(a) || date(b) - date(a) || Number(b.id) - Number(a.id)).slice(0, limit);
}

// Bound the candidate requests while still finding relevant stories beyond the latest page.
export async function fetchRelatedArticles(article, getAll) {
  const candidates = await fetchCandidates(article, getAll, { status: 'published', orderBy: 'createdAt', order: 'desc' }, 'articles');
  return selectRelatedArticles(article, candidates);
}

export async function fetchRelatedPolls(poll, getAll) {
  const candidates = await fetchCandidates(poll, getAll, { status: 'active', visibility: 'public' }, 'polls');
  return selectRelatedPolls(poll, candidates);
}

async function fetchCandidates(article, getAll, params, collection) {
  const filters = [
    {},
    ...(article.category ? [{ category: article.category }] : []),
    ...tagsOf(article).slice(0, 2).map((tag) => ({ tag })),
  ];
  const results = await Promise.allSettled(filters.map((filter) => getAll({
    ...params, limit: 12, ...filter,
  })));
  return results.flatMap((result) => result.status === 'fulfilled'
    ? result.value?.data?.[collection] || [] : []);
}
