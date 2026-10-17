const { sequelize, Article, User } = require('../src/models');
const { createArticle, getAllArticles, getCategoryCounts } = require('../src/services/articleService');
const draft = {
  type: 'analysis', status: 'draft', title: 'Fuel prices and possible solutions',
  content: 'An analysis of fuel prices with sources and policy comparisons.',
  category: 'Οικονομία',
};

describe('Analysis publishing', () => {
  let author;
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    author = await User.create({ username: 'analyst', email: 'analyst@example.com', password: 'password123', role: 'editor' });
  });
  afterAll(() => sequelize.close());

  test('creates the sourced draft privately and lists it only after publication', async () => {
    const created = await createArticle(author.id, author.role, draft);
    expect(created.success).toBe(true);
    const id = created.data.article.id;
    expect(created.data.article.status).toBe('draft');
    expect((await getAllArticles({ type: 'analysis' }, null)).data.articles).toHaveLength(0);
    await Article.update({ status: 'published', publishedAt: new Date() }, { where: { id } });
    await Article.create({ title: 'An ordinary article', content: 'Different editorial content', type: 'articles', status: 'published', authorId: author.id });
    const listed = await getAllArticles({ type: 'analysis', category: draft.category }, null);
    expect(listed.data.articles.map((article) => article.id)).toEqual([id]);
    expect((await getCategoryCounts({ type: 'analysis' })).data.counts).toEqual({ [draft.category]: 1 });
  });
});
