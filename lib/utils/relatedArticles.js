const normalize = (value) => typeof value === 'string' ? value.trim().toLowerCase() : '';
const tagsOf = (item) => [...new Set((Array.isArray(item.tags) ? item.tags : []).map(normalize).filter(Boolean))];

const isEligibleArticle = (candidate) => candidate.status === 'published'
  && (candidate.type !== 'news' || Boolean(candidate.newsApprovedAt));

const isEligiblePoll = (now) => (candidate) => candidate.status === 'active'
  && candidate.visibility === 'public'
  && (!candidate.deadline || Date.parse(candidate.deadline) > now);

/**
 * Pick related articles for any source item (article or poll).
 * Pass `excludeId` only when the source is itself an article, so a poll's id
 * never hides an unrelated article that happens to share the same number.
 */
export function selectRelatedArticles(source, candidates, limit = 4, { excludeId = source?.id } = {}) {
  return rankRelated(source, candidates, limit, isEligibleArticle, excludeId);
}

/** Pick related polls for any source item (article or poll). */
export function selectRelatedPolls(source, candidates, limit = 4, now = Date.now(), { excludeId = source?.id } = {}) {
  return rankRelated(source, candidates, limit, isEligiblePoll(now), excludeId);
}

/**
 * Order: the single newest eligible item first, then items sharing tags
 * (category as a weaker signal), then the newest of the rest as filler.
 */
function rankRelated(source, candidates, limit, eligible, excludeId) {
  if (limit <= 0) return [];
  const tags = new Set(tagsOf(source));
  const category = normalize(source.category);
  const seen = new Set(excludeId == null ? [] : [String(excludeId)]);
  const score = (candidate) => tagsOf(candidate).filter((tag) => tags.has(tag)).length * 3
    + (category && normalize(candidate.category) === category ? 2 : 0);
  const date = (candidate) => Date.parse(candidate.publishedAt || candidate.createdAt) || 0;
  const byNewest = (a, b) => date(b) - date(a) || Number(b.id) - Number(a.id);

  const pool = candidates.filter((candidate) => {
    if (!candidate?.id || seen.has(String(candidate.id)) || !eligible(candidate)) return false;
    seen.add(String(candidate.id));
    return true;
  });
  if (!pool.length) return [];

  const [latest, ...rest] = [...pool].sort(byNewest);
  rest.sort((a, b) => score(b) - score(a) || byNewest(a, b));
  return [latest, ...rest].slice(0, limit);
}

// Bound the candidate requests while still finding relevant items beyond the latest page.
export async function fetchRelatedArticles(source, getAll, { limit = 4, excludeId = source?.id } = {}) {
  const candidates = await fetchCandidates(source, getAll, { status: 'published', orderBy: 'createdAt', order: 'desc' }, 'articles');
  return selectRelatedArticles(source, candidates, limit, { excludeId });
}

export async function fetchRelatedPolls(source, getAll, { limit = 4, excludeId = source?.id } = {}) {
  const candidates = await fetchCandidates(source, getAll, { status: 'active', visibility: 'public' }, 'polls');
  return selectRelatedPolls(source, candidates, limit, Date.now(), { excludeId });
}

async function fetchCandidates(source, getAll, params, collection) {
  const filters = [
    {},
    ...(source.category ? [{ category: source.category }] : []),
    ...tagsOf(source).slice(0, 2).map((tag) => ({ tag })),
  ];
  const results = await Promise.allSettled(filters.map((filter) => getAll({
    ...params, limit: 12, ...filter,
  })));
  return results.flatMap((result) => result.status === 'fulfilled'
    ? result.value?.data?.[collection] || [] : []);
}
