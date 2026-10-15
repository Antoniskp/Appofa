const { sequelize, Article, User } = require('../src/models');
const { getAllArticles, getCategoryCounts } = require('../src/services/articleService');

describe('Video kind and topic filtering', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    const user = await User.create({ username: 'videoeditor', email: 'video@example.com', password: 'password123', role: 'editor' });
    await Article.bulkCreate([
      { title: 'Economy lesson', category: 'Οικονομία', sourceMeta: { videoKind: 'educational' } },
      { title: 'Health lesson', category: 'Υγεία', sourceMeta: { videoKind: 'educational' } },
      { title: 'Economy news', category: 'Οικονομία', sourceMeta: { videoKind: 'news' } },
      { title: 'Legacy video', category: 'Οικονομία', sourceMeta: null },
    ].map((item) => ({ ...item, content: '', type: 'video', status: 'published', authorId: user.id })));
  });
  afterAll(() => sequelize.close());

  test('filters kind and topic before pagination', async () => {
    const result = await getAllArticles({ type: 'video', videoKind: 'educational', category: 'Οικονομία', limit: 1 }, null);
    expect(result.success).toBe(true);
    expect(result.data.articles.map((item) => item.title)).toEqual(['Economy lesson']);
    expect(result.data.pagination.totalPages).toBe(1);
  });

  test('counts topics within each kind and keeps legacy videos in all', async () => {
    const result = await getCategoryCounts({ type: 'video', videoKind: 'news' });
    expect(result.data.counts).toEqual({ 'Οικονομία': 1 });
    const all = await getAllArticles({ type: 'video' }, null);
    expect(all.data.articles).toHaveLength(4);
  });

  test('rejects invalid kinds', async () => {
    expect((await getAllArticles({ videoKind: 'invalid' }, null)).status).toBe(400);
    expect((await getCategoryCounts({ videoKind: 'invalid' })).status).toBe(400);
  });
});
