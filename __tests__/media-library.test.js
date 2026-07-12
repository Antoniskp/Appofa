const request = require('supertest');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { sequelize, User, MediaAsset, Article, Poll, PollOption } = require('../src/models');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');
const { storeCsrfToken } = require('../src/utils/csrf');

const authRoutes = require('../src/routes/authRoutes');
const articleRoutes = require('../src/routes/articleRoutes');
const mediaRoutes = require('../src/routes/mediaRoutes');
const pollRoutes = require('../src/routes/pollRoutes');

const app = express();
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/polls', pollRoutes);

const TEST_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8B2V0AAAAASUVORK5CYII=',
  'base64'
);

describe('Media library integration', () => {
  let editorToken;
  let editorId;
  let uploadedMediaId;
  let adminToken;
  let regularToken;
  let regularId;
  let uploadedSharedMediaId;

  const csrfHeaderFor = (token) => ({
    Cookie: [`csrf_token=${token}`],
    'x-csrf-token': token,
  });

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    await User.create({
      username: 'mediaeditor',
      email: 'mediaeditor@test.com',
      password: 'editor123',
      role: 'editor',
      firstNameNative: 'Media',
      lastNameNative: 'Editor',
    });

    const editor = await User.findOne({ where: { email: 'mediaeditor@test.com' } });
    editorId = editor.id;

    await User.create({
      username: 'mediaadmin',
      email: 'mediaadmin@test.com',
      password: 'admin123',
      role: 'admin',
      firstNameNative: 'Media',
      lastNameNative: 'Admin',
    });
    await User.create({
      username: 'mediauser',
      email: 'mediauser@test.com',
      password: 'user123',
      role: 'user',
      firstNameNative: 'Media',
      lastNameNative: 'User',
    });
    const regular = await User.findOne({ where: { email: 'mediauser@test.com' } });
    regularId = regular.id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'mediaeditor@test.com', password: 'editor123' });

    const authCookie = loginResponse.headers['set-cookie'].find((cookie) => cookie.startsWith('auth_token='));
    editorToken = authCookie.split(';')[0].replace('auth_token=', '');

    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'mediaadmin@test.com', password: 'admin123' });
    const adminCookie = adminLoginResponse.headers['set-cookie'].find((cookie) => cookie.startsWith('auth_token='));
    adminToken = adminCookie.split(';')[0].replace('auth_token=', '');

    const regularLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'mediauser@test.com', password: 'user123' });
    const regularCookie = regularLoginResponse.headers['set-cookie'].find((cookie) => cookie.startsWith('auth_token='));
    regularToken = regularCookie.split(';')[0].replace('auth_token=', '');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('uploads media and stores variants', async () => {
    const csrfToken = 'csrf-media-upload';
    storeCsrfToken(csrfToken, editorId);

    const response = await request(app)
      .post('/api/media/upload')
      .set('Authorization', 'Bearer ' + editorToken)
      .set(csrfHeaderFor(csrfToken))
      .field('usageType', 'article_cover')
      .field('entityType', 'article')
      .field('altText', 'Test cover alt')
      .attach('image', TEST_PNG, { filename: 'cover.png', contentType: 'image/png' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.media).toHaveProperty('id');
    expect(response.body.media.variants).toHaveProperty('articleCover');
    expect(response.body.media.variants).toHaveProperty('thumbnail');
    uploadedMediaId = response.body.media.id;
  });

  test('lists media with search and quota payload', async () => {
    const response = await request(app)
      .get('/api/media?usageType=article_cover&search=test')
      .set('Authorization', 'Bearer ' + editorToken);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.media)).toBe(true);
    expect(response.body.quota).toHaveProperty('usedBytes');
    expect(response.body.media.some((item) => item.id === uploadedMediaId)).toBe(true);
  });

  test('creates article with coverImageId and uses optimized cover url', async () => {
    const csrfToken = 'csrf-article-create-media';
    storeCsrfToken(csrfToken, editorId);

    const media = await MediaAsset.findByPk(uploadedMediaId);
    const expectedCoverUrl = media.variants?.articleCover?.url || media.url;

    const response = await request(app)
      .post('/api/articles')
      .set('Authorization', 'Bearer ' + editorToken)
      .set(csrfHeaderFor(csrfToken))
      .send({
        title: 'Media-backed article',
        content: 'This article uses a selected media asset for its cover image.',
        status: 'published',
        type: 'articles',
        tags: ['media'],
        coverImageId: uploadedMediaId,
        bannerImageAltText: 'Updated alt',
        bannerImageCaption: 'Cover caption',
        bannerImageCredit: 'Photographer',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.article.coverImageId).toBe(uploadedMediaId);
    expect(response.body.data.article.bannerImageUrl).toBe(expectedCoverUrl);
    expect(response.body.data.article.bannerImageAltText).toBe('Updated alt');
  });

  test('prevents deleting media asset that is still referenced', async () => {
    const csrfToken = 'csrf-media-delete';
    storeCsrfToken(csrfToken, editorId);

    const response = await request(app)
      .delete(`/api/media/${uploadedMediaId}`)
      .set('Authorization', 'Bearer ' + editorToken)
      .set(csrfHeaderFor(csrfToken));

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  test('prevents deleting media asset that is referenced by poll option mediaAssetId', async () => {
    const csrfToken = 'csrf-poll-option-media';
    storeCsrfToken(csrfToken, editorId);

    const poll = await Poll.create({
      title: 'Media Poll',
      description: 'Poll with media option',
      type: 'complex',
      allowUserContributions: false,
      voteRestriction: 'authenticated',
      visibility: 'public',
      resultsVisibility: 'always',
      creatorId: editorId,
      status: 'active',
    });
    await PollOption.create({
      pollId: poll.id,
      text: 'Option with media',
      mediaAssetId: uploadedMediaId,
      photoUrl: '/uploads/media/example.webp',
      order: 0,
    });
    await PollOption.create({
      pollId: poll.id,
      text: 'Second option',
      order: 1,
    });

    const response = await request(app)
      .delete(`/api/media/${uploadedMediaId}`)
      .set('Authorization', 'Bearer ' + editorToken)
      .set(csrfHeaderFor(csrfToken));

    expect(response.status).toBe(409);
    expect(response.body.references).toBeGreaterThan(0);
    expect(response.body.referenceSummary.poll_option).toBeGreaterThan(0);
  });

  test('avatar upload uses shared media pipeline', async () => {
    const csrfToken = 'csrf-avatar-upload';
    storeCsrfToken(csrfToken, editorId);

    const response = await request(app)
      .post('/api/auth/me/avatar')
      .set('Authorization', 'Bearer ' + editorToken)
      .set(csrfHeaderFor(csrfToken))
      .attach('avatar', TEST_PNG, { filename: 'avatar.png', contentType: 'image/png' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.avatarUrl).toContain('/uploads/profiles/');

    const user = await User.findByPk(editorId);
    expect(user.avatar).toBe(response.body.data.avatarUrl);
  });

  test('cleanup service supports dry-run orphan detection', async () => {
    const mediaService = require('../src/services/mediaService');
    const markResult = await mediaService.markOrphanMediaAssets();
    expect(markResult).toHaveProperty('orphaned');

    const cleanupResult = await mediaService.cleanupOrphanMediaAssets({ dryRun: true, olderThanDays: 1 });
    expect(cleanupResult.dryRun).toBe(true);
    expect(Array.isArray(cleanupResult.candidates)).toBe(true);
  });

  test('admin endpoints expose media stats and cleanup report', async () => {
    const statsResponse = await request(app)
      .get('/api/media/admin/stats')
      .set('Authorization', 'Bearer ' + adminToken);

    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.success).toBe(true);
    expect(statsResponse.body.stats).toHaveProperty('totalAssetCount');
    expect(statsResponse.body.stats).toHaveProperty('quotaConfig');

    const cleanupResponse = await request(app)
      .get('/api/media/admin/cleanup-report?olderThanDays=1')
      .set('Authorization', 'Bearer ' + adminToken);

    expect(cleanupResponse.status).toBe(200);
    expect(cleanupResponse.body.success).toBe(true);
    expect(cleanupResponse.body.report).toHaveProperty('cleanup');
  });

  test('regular users can upload shared poll-option media but not article covers', async () => {
    const sharedCsrfToken = 'csrf-regular-shared-upload';
    storeCsrfToken(sharedCsrfToken, regularId);

    const sharedResponse = await request(app)
      .post('/api/media/upload')
      .set('Authorization', 'Bearer ' + regularToken)
      .set(csrfHeaderFor(sharedCsrfToken))
      .field('usageType', 'shared')
      .field('entityType', 'shared')
      .field('altText', 'Regular user shared option')
      .attach('image', TEST_PNG, { filename: 'option.png', contentType: 'image/png' });

    expect(sharedResponse.status).toBe(201);
    expect(sharedResponse.body.success).toBe(true);
    expect(sharedResponse.body.media.uploadedByUserId).toBe(regularId);
    expect(sharedResponse.body.media.usageType).toBe('shared');
    expect(sharedResponse.body.media.entityType).toBe('shared');
    expect(sharedResponse.body.quota).toHaveProperty('remainingBytes');
    uploadedSharedMediaId = sharedResponse.body.media.id;

    const articleCsrfToken = 'csrf-regular-article-upload';
    storeCsrfToken(articleCsrfToken, regularId);

    const articleResponse = await request(app)
      .post('/api/media/upload')
      .set('Authorization', 'Bearer ' + regularToken)
      .set(csrfHeaderFor(articleCsrfToken))
      .field('usageType', 'article_cover')
      .field('entityType', 'article')
      .attach('image', TEST_PNG, { filename: 'cover.png', contentType: 'image/png' });

    expect(articleResponse.status).toBe(403);
    expect(articleResponse.body.success).toBe(false);
  });

  test('regular users can create complex polls with their own shared media asset', async () => {
    const csrfToken = 'csrf-regular-poll-shared-media';
    storeCsrfToken(csrfToken, regularId);

    const response = await request(app)
      .post('/api/polls')
      .set('Authorization', 'Bearer ' + regularToken)
      .set(csrfHeaderFor(csrfToken))
      .send({
        title: 'Regular user shared-media poll',
        description: 'Uses a self-service shared media asset for one option.',
        type: 'complex',
        allowUserContributions: false,
        voteRestriction: 'authenticated',
        visibility: 'public',
        resultsVisibility: 'after_vote',
        options: [
          {
            text: 'Media-backed option',
            mediaAssetId: uploadedSharedMediaId,
            answerType: 'custom',
          },
          {
            text: 'Plain option',
            answerType: 'custom',
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.options[0].mediaAssetId).toBe(uploadedSharedMediaId);
    expect(response.body.data.options[0].photoUrl).toContain('/uploads/media/');
  });

  test('article relation to media remains queryable', async () => {
    const article = await Article.findOne({ where: { title: 'Media-backed article' } });
    expect(article.coverImageId).toBe(uploadedMediaId);
  });
});
