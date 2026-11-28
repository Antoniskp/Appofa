import { fetchRelatedArticles, selectRelatedArticles, fetchRelatedPolls, selectRelatedPolls } from '../lib/utils/relatedArticles';

const story = (id, extra = {}) => ({ id, status: 'published', type: 'articles', createdAt: '2026-10-01', ...extra });

describe('related stories', () => {
  const current = story(1, { category: 'Politics', tags: ['Athens'] });

  it('shows the single newest story first, then shared tags and categories, then recent stories', () => {
    const candidates = [
      story(2, { createdAt: '2026-10-20' }),
      story(3, { category: 'Politics' }),
      story(4, { tags: [' ATHENS '] }),
      story(5, { category: 'Politics', tags: ['athens'] }),
      story(6, { createdAt: '2026-10-19' }),
    ];
    expect(selectRelatedArticles(current, candidates).map((item) => item.id)).toEqual([2, 5, 4, 3]);
  });

  it('excludes the current story, duplicates, drafts, archived and unapproved news', () => {
    const candidates = [current, story('1'), story(2), story('2'), story(3, { status: 'draft' }),
      story(4, { status: 'archived' }), story(5, { type: 'news' }),
      story(6, { type: 'news', newsApprovedAt: '2026-10-01' })];
    expect(selectRelatedArticles(current, candidates).map((item) => item.id)).toEqual([6, 2]);
  });

  it('uses recency when there is no taxonomy and handles empty results', () => {
    expect(selectRelatedArticles(story(1), [story(2), story(3, { createdAt: '2026-10-20' })])
      .map((item) => item.id)).toEqual([3, 2]);
    expect(selectRelatedArticles(current, [])).toEqual([]);
  });

  it('fetches relevant pools and keeps successful results if one request fails', async () => {
    const getAll = jest.fn(async (params) => {
      if (params.tag) throw new Error('Unavailable');
      return { data: { articles: params.category ? [story(3, { category: 'Politics' })] : [story(2)] } };
    });
    expect((await fetchRelatedArticles(current, getAll)).map((item) => item.id)).toEqual([3, 2]);
    expect(getAll).toHaveBeenCalledTimes(3);
    expect(getAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'published', tag: 'athens', limit: 12 }));
  });

  it('silently omits recommendations when every request fails', async () => {
    expect(await fetchRelatedArticles(current, async () => { throw new Error('Offline'); })).toEqual([]);
  });
});

describe('related polls', () => {
  const poll = (id, extra = {}) => ({ id, status: 'active', visibility: 'public', createdAt: '2026-10-01', ...extra });

  it('excludes current, duplicate, closed, expired and restricted polls', () => {
    const candidates = [poll(1), poll(2), poll('2'), poll(3, { status: 'closed' }),
      poll(4, { deadline: '2026-09-30' }), poll(5, { visibility: 'private' }),
      poll(6, { visibility: 'locals_only' }), poll(7, { deadline: '2026-11-01' })];
    expect(selectRelatedPolls(poll(1), candidates, 4, Date.parse('2026-10-31')).map((item) => item.id)).toEqual([7, 2]);
  });

  it('prioritizes relevant polls and requests only active public candidates', async () => {
    const current = poll(1, { category: 'Education', tags: ['Schools'] });
    const getAll = jest.fn(async () => ({ data: { polls: [
      poll(2, { createdAt: '2026-10-30' }), poll(3, { tags: ['schools'] }),
      poll(4, { category: 'Education' }),
    ] } }));
    expect((await fetchRelatedPolls(current, getAll)).map((item) => item.id)).toEqual([2, 3, 4]);
    expect(getAll).toHaveBeenCalledTimes(3);
    expect(getAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'active', visibility: 'public', limit: 12 }));
  });
});

describe('cross-type related content', () => {
  const article = { id: 7, category: 'Politics', tags: ['Τέμπη'] };
  const poll = (id, extra = {}) => ({ id, status: 'active', visibility: 'public', createdAt: '2026-10-01', ...extra });
  const story = (id, extra = {}) => ({ id, status: 'published', type: 'articles', createdAt: '2026-10-01', ...extra });

  it('does not hide a poll that shares the source article id when excludeId is null', () => {
    const candidates = [poll(7, { tags: ['τέμπη'] }), poll(8, { createdAt: '2026-10-20' }), poll(9)];
    expect(selectRelatedPolls(article, candidates, 2, Date.parse('2026-10-31'), { excludeId: null })
      .map((item) => item.id)).toEqual([8, 7]);
  });

  it('still excludes the source by default', () => {
    expect(selectRelatedArticles(article, [story(7), story(8)]).map((item) => item.id)).toEqual([8]);
  });

  it('respects the limit and handles a limit of one', () => {
    const candidates = [story(1, { createdAt: '2026-10-20' }), story(2, { tags: ['τέμπη'] }), story(3)];
    expect(selectRelatedArticles(article, candidates, 1, { excludeId: null }).map((item) => item.id)).toEqual([1]);
    expect(selectRelatedArticles(article, candidates, 2, { excludeId: null }).map((item) => item.id)).toEqual([1, 2]);
  });

  it('fetches related articles for a poll without excluding by id', async () => {
    const getAll = jest.fn(async () => ({ data: { articles: [story(5, { tags: ['τέμπη'] }), story(6, { createdAt: '2026-10-25' })] } }));
    expect((await fetchRelatedArticles(poll(5, { tags: ['Τέμπη'] }), getAll, { limit: 2, excludeId: null }))
      .map((item) => item.id)).toEqual([6, 5]);
  });
});
