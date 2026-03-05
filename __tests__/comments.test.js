const request = require('supertest');
const { sequelize, User, Article, Poll, Comment, Location } = require('../src/models');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');

const authRoutes = require('../src/routes/authRoutes');
const articleRoutes = require('../src/routes/articleRoutes');
const pollRoutes = require('../src/routes/pollRoutes');
const followRoutes = require('../src/routes/followRoutes');
const commentRoutes = require('../src/routes/commentRoutes');

const app = express();
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/users', followRoutes);
app.use('/api/comments', commentRoutes);

describe('Comment System Tests', () => {
  let adminToken, adminUserId;
  let authorToken, authorUserId;
  let viewerToken, viewerUserId;
  let moderatorToken, moderatorUserId;
  let testArticleId;
  let testPollId;
  let locationId;

  const csrfToken = 'test-csrf-token-comments';

  const csrfHeaders = (userId) => {
    const { storeCsrfToken } = require('../src/utils/csrf');
    storeCsrfToken(csrfToken, userId);
    return {
      Cookie: [`csrf_token=${csrfToken}`],
      'x-csrf-token': csrfToken
    };
  };

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    // Create a location for the poll
    const loc = await Location.create({
      name: 'Comment Test City',
      type: 'city',
      slug: 'comment-test-city',
      latitude: 0,
      longitude: 0
    });
    locationId = loc.id;

    // Register users
    const registerAndLogin = async (username, role) => {
      await request(app).post('/api/auth/register').send({
        username,
        email: `${username}@test.com`,
        password: 'Test1234!'
      });
      const user = await User.findOne({ where: { username } });
      await user.update({ role });
      const loginRes = await request(app).post('/api/auth/login').send({
        email: `${username}@test.com`,
        password: 'Test1234!'
      });
      const authCookie = loginRes.headers['set-cookie'].find(c => c.startsWith('auth_token='));
      const token = authCookie.split(';')[0].replace('auth_token=', '');
      return { token, id: user.id };
    };

    ({ token: adminToken, id: adminUserId } = await registerAndLogin('cmt_admin', 'admin'));
    ({ token: authorToken, id: authorUserId } = await registerAndLogin('cmt_author', 'editor'));
    ({ token: viewerToken, id: viewerUserId } = await registerAndLogin('cmt_viewer', 'viewer'));
    ({ token: moderatorToken, id: moderatorUserId } = await registerAndLogin('cmt_moderator', 'moderator'));

    // Create a test article
    const articleRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Bearer ${authorToken}`)
      .set(csrfHeaders(authorUserId))
      .send({ title: 'Comment Test Article', content: 'Article content for comment testing.', status: 'published' });
    testArticleId = articleRes.body.data?.article?.id;

    // Create a test poll
    const pollRes = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${authorToken}`)
      .set(csrfHeaders(authorUserId))
      .send({
        title: 'Comment Test Poll',
        type: 'simple',
        locationId,
        options: [{ text: 'Option A' }, { text: 'Option B' }]
      });
    testPollId = pollRes.body.data?.id || pollRes.body.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ─── GET /api/comments ────────────────────────────────────────────────────

  describe('GET /api/comments', () => {
    it('should allow unauthenticated access (comments are publicly readable)', async () => {
      const res = await request(app).get(`/api/comments?entityType=article&entityId=${testArticleId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when entityType is missing', async () => {
      const res = await request(app)
        .get(`/api/comments?entityId=${testArticleId}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid entityType', async () => {
      const res = await request(app)
        .get(`/api/comments?entityType=bogus&entityId=${testArticleId}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for non-numeric entityId', async () => {
      const res = await request(app)
        .get('/api/comments?entityType=article&entityId=abc')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(400);
    });

    it('should return empty comment list for a new article', async () => {
      const res = await request(app)
        .get(`/api/comments?entityType=article&entityId=${testArticleId}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comments).toEqual([]);
    });
  });

  // ─── POST /api/comments ───────────────────────────────────────────────────

  describe('POST /api/comments', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set(csrfHeaders(0))
        .send({ entityType: 'article', entityId: testArticleId, body: 'Hello' });
      expect(res.status).toBe(401);
    });

    it('should reject empty body', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'article', entityId: testArticleId, body: '   ' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject body over 10000 chars', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'article', entityId: testArticleId, body: 'x'.repeat(10001) });
      expect(res.status).toBe(400);
    });

    it('should reject invalid entityType', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'invalid', entityId: testArticleId, body: 'Hello' });
      expect(res.status).toBe(400);
    });

    it('should return 404 when entity does not exist', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'article', entityId: 99999, body: 'Hello' });
      expect(res.status).toBe(404);
    });

    it('should successfully create a top-level comment on an article', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'article', entityId: testArticleId, body: 'First comment!' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment).toMatchObject({
        entityType: 'article',
        entityId: testArticleId,
        body: 'First comment!',
        status: 'visible',
        parentId: null
      });
      expect(res.body.data.comment.author).toMatchObject({ id: viewerUserId });
    });

    it('should successfully create a reply (parentId)', async () => {
      // First create a parent
      const parentRes = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'article', entityId: testArticleId, body: 'Parent comment' });
      const parentId = parentRes.body.data.comment.id;

      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'article', entityId: testArticleId, parentId, body: 'Reply comment' });
      expect(res.status).toBe(201);
      expect(res.body.data.comment.parentId).toBe(parentId);
    });

    it('should reject parentId that belongs to a different entity', async () => {
      // Create a comment on the poll
      const pollCmt = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'poll', entityId: testPollId, body: 'Poll comment' });
      const pollCommentId = pollCmt.body.data.comment.id;

      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'article', entityId: testArticleId, parentId: pollCommentId, body: 'Cross-entity reply' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/different entity/i);
    });

    it('should return 404 for non-existent parentId', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'article', entityId: testArticleId, parentId: 99999, body: 'Reply' });
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/parent comment not found/i);
    });

    it('should create a comment on a poll', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'poll', entityId: testPollId, body: 'Poll comment!' });
      expect(res.status).toBe(201);
      expect(res.body.data.comment.entityType).toBe('poll');
    });

    it('should create a comment on a user_profile', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'user_profile', entityId: authorUserId, body: 'Nice profile!' });
      expect(res.status).toBe(201);
      expect(res.body.data.comment.entityType).toBe('user_profile');
    });
  });

  // ─── GET comments after creation ─────────────────────────────────────────

  describe('GET /api/comments after creation', () => {
    it('should return created comments with author info', async () => {
      const res = await request(app)
        .get(`/api/comments?entityType=article&entityId=${testArticleId}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.comments.length).toBeGreaterThan(0);
      const comment = res.body.data.comments[0];
      expect(comment).toHaveProperty('author');
      expect(comment.author).toHaveProperty('username');
    });
  });

  // ─── PATCH /:id/hide ──────────────────────────────────────────────────────

  describe('PATCH /api/comments/:id/hide', () => {
    let targetCommentId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'article', entityId: testArticleId, body: 'To be hidden' });
      targetCommentId = res.body.data.comment.id;
    });

    it('should deny hide to non-moderator non-owner', async () => {
      // viewerToken is not the article author or admin/moderator
      // But viewerToken IS the comment author, not the entity owner
      const otherUserRes = await request(app).post('/api/auth/register').send({
        username: 'hide_test_user',
        email: 'hide_test@test.com',
        password: 'Test1234!'
      });
      const otherLoginRes = await request(app).post('/api/auth/login').send({
        email: 'hide_test@test.com',
        password: 'Test1234!'
      });
      const otherAuthCookie = otherLoginRes.headers['set-cookie'].find(c => c.startsWith('auth_token='));
      const otherToken = otherAuthCookie.split(';')[0].replace('auth_token=', '');
      const otherUser = await User.findOne({ where: { username: 'hide_test_user' } });

      const res = await request(app)
        .patch(`/api/comments/${targetCommentId}/hide`)
        .set('Authorization', `Bearer ${otherToken}`)
        .set(csrfHeaders(otherUser.id));
      expect(res.status).toBe(403);
    });

    it('should allow admin to hide a comment', async () => {
      const res = await request(app)
        .patch(`/api/comments/${targetCommentId}/hide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaders(adminUserId));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/hidden/i);
    });

    it('should allow moderator to hide a comment', async () => {
      const newCmt = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'article', entityId: testArticleId, body: 'Moderator will hide this' });
      const cmtId = newCmt.body.data.comment.id;

      const res = await request(app)
        .patch(`/api/comments/${cmtId}/hide`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .set(csrfHeaders(moderatorUserId));
      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent comment', async () => {
      const res = await request(app)
        .patch('/api/comments/99999/hide')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaders(adminUserId));
      expect(res.status).toBe(404);
    });

    it('should not allow hiding a deleted comment', async () => {
      // Delete the comment first
      const cmt = await Comment.findByPk(targetCommentId);
      await cmt.update({ status: 'deleted' });

      const res = await request(app)
        .patch(`/api/comments/${targetCommentId}/hide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaders(adminUserId));
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/deleted/i);
    });
  });

  // ─── PATCH /:id/unhide ────────────────────────────────────────────────────

  describe('PATCH /api/comments/:id/unhide', () => {
    let hiddenCommentId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'article', entityId: testArticleId, body: 'To be unhidden' });
      hiddenCommentId = res.body.data.comment.id;
      // Hide it
      await Comment.findByPk(hiddenCommentId).then(c => c.update({ status: 'hidden' }));
    });

    it('should allow admin to unhide a comment', async () => {
      const res = await request(app)
        .patch(`/api/comments/${hiddenCommentId}/unhide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaders(adminUserId));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/unhidden/i);
    });

    it('should return 404 for non-existent comment', async () => {
      const res = await request(app)
        .patch('/api/comments/99999/unhide')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaders(adminUserId));
      expect(res.status).toBe(404);
    });
  });

  // ─── DELETE /api/comments/:id ─────────────────────────────────────────────

  describe('DELETE /api/comments/:id', () => {
    let commentToDelete;
    let otherUserCommentId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'article', entityId: testArticleId, body: 'To be deleted by author' });
      commentToDelete = res.body.data.comment.id;

      const res2 = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authorToken}`)
        .set(csrfHeaders(authorUserId))
        .send({ entityType: 'article', entityId: testArticleId, body: 'Author comment' });
      otherUserCommentId = res2.body.data.comment.id;
    });

    it('should allow the author to delete their own comment', async () => {
      const res = await request(app)
        .delete(`/api/comments/${commentToDelete}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/deleted/i);
    });

    it('should soft-delete (status=deleted, body preserved in DB)', async () => {
      const deleted = await Comment.findByPk(commentToDelete);
      expect(deleted.status).toBe('deleted');
      expect(deleted.body).toBe('To be deleted by author'); // body preserved in DB
    });

    it('should deny delete to non-author non-privileged user', async () => {
      // Register a fresh viewer
      await request(app).post('/api/auth/register').send({
        username: 'del_deny_user',
        email: 'del_deny@test.com',
        password: 'Test1234!'
      });
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'del_deny@test.com',
        password: 'Test1234!'
      });
      const denyAuthCookie = loginRes.headers['set-cookie'].find(c => c.startsWith('auth_token='));
      const denyToken = denyAuthCookie.split(';')[0].replace('auth_token=', '');
      const denyUser = await User.findOne({ where: { username: 'del_deny_user' } });

      const res = await request(app)
        .delete(`/api/comments/${otherUserCommentId}`)
        .set('Authorization', `Bearer ${denyToken}`)
        .set(csrfHeaders(denyUser.id));
      expect(res.status).toBe(403);
    });

    it('should allow admin to delete any comment', async () => {
      const res = await request(app)
        .delete(`/api/comments/${otherUserCommentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaders(adminUserId));
      expect(res.status).toBe(200);
    });

    it('should return 400 when trying to delete an already deleted comment', async () => {
      const res = await request(app)
        .delete(`/api/comments/${commentToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaders(adminUserId));
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already deleted/i);
    });

    it('should return 404 for non-existent comment', async () => {
      const res = await request(app)
        .delete('/api/comments/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaders(adminUserId));
      expect(res.status).toBe(404);
    });
  });

  // ─── Deleted comment body masking in GET ──────────────────────────────────

  describe('Deleted comment body masking', () => {
    it('should return null body for deleted comments in GET', async () => {
      const createRes = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'article', entityId: testArticleId, body: 'Will be deleted' });
      const cmtId = createRes.body.data.comment.id;

      await request(app)
        .delete(`/api/comments/${cmtId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId));

      const getRes = await request(app)
        .get(`/api/comments?entityType=article&entityId=${testArticleId}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      const deleted = getRes.body.data.comments.find(c => c.id === cmtId);
      expect(deleted).toBeDefined();
      expect(deleted.body).toBeNull();
      expect(deleted._deleted).toBe(true);
    });
  });

  // ─── PATCH /api/articles/:id/comment-settings ─────────────────────────────

  describe('PATCH /api/articles/:id/comment-settings', () => {
    it('should allow article author to update comment settings', async () => {
      const res = await request(app)
        .patch(`/api/articles/${testArticleId}/comment-settings`)
        .set('Authorization', `Bearer ${authorToken}`)
        .set(csrfHeaders(authorUserId))
        .send({ commentsEnabled: false, commentsLocked: true });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.commentsEnabled).toBe(false);
      expect(res.body.data.commentsLocked).toBe(true);
    });

    it('should block comments when commentsEnabled=false', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'article', entityId: testArticleId, body: 'Should be blocked' });
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/disabled/i);
    });

    it('should block comments when commentsLocked=true', async () => {
      // Re-enable but keep locked
      await request(app)
        .patch(`/api/articles/${testArticleId}/comment-settings`)
        .set('Authorization', `Bearer ${authorToken}`)
        .set(csrfHeaders(authorUserId))
        .send({ commentsEnabled: true, commentsLocked: true });

      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'article', entityId: testArticleId, body: 'Should be locked' });
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/locked/i);
    });

    it('should deny settings update to non-author non-privileged user', async () => {
      const res = await request(app)
        .patch(`/api/articles/${testArticleId}/comment-settings`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ commentsEnabled: true });
      expect(res.status).toBe(403);
    });

    it('should allow admin to update comment settings', async () => {
      const res = await request(app)
        .patch(`/api/articles/${testArticleId}/comment-settings`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaders(adminUserId))
        .send({ commentsEnabled: true, commentsLocked: false });
      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent article', async () => {
      const res = await request(app)
        .patch('/api/articles/99999/comment-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaders(adminUserId))
        .send({ commentsEnabled: false });
      expect(res.status).toBe(404);
    });
  });

  // ─── PATCH /api/polls/:id/comment-settings ────────────────────────────────

  describe('PATCH /api/polls/:id/comment-settings', () => {
    it('should allow poll creator to update comment settings', async () => {
      const res = await request(app)
        .patch(`/api/polls/${testPollId}/comment-settings`)
        .set('Authorization', `Bearer ${authorToken}`)
        .set(csrfHeaders(authorUserId))
        .send({ commentsEnabled: false });
      expect(res.status).toBe(200);
      expect(res.body.data.commentsEnabled).toBe(false);
    });

    it('should deny settings update to non-creator non-privileged user', async () => {
      const res = await request(app)
        .patch(`/api/polls/${testPollId}/comment-settings`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ commentsEnabled: true });
      expect(res.status).toBe(403);
    });

    it('should allow admin to update poll comment settings', async () => {
      const res = await request(app)
        .patch(`/api/polls/${testPollId}/comment-settings`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaders(adminUserId))
        .send({ commentsEnabled: true, commentsLocked: false });
      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent poll', async () => {
      const res = await request(app)
        .patch('/api/polls/99999/comment-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaders(adminUserId))
        .send({ commentsEnabled: false });
      expect(res.status).toBe(404);
    });
  });

  // ─── PATCH /api/users/:id/profile-comment-settings ───────────────────────

  describe('PATCH /api/users/:id/profile-comment-settings', () => {
    it('should allow user to update their own profile comment settings', async () => {
      const res = await request(app)
        .patch(`/api/users/${viewerUserId}/profile-comment-settings`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ profileCommentsEnabled: false, profileCommentsLocked: true });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profileCommentsEnabled).toBe(false);
      expect(res.body.data.profileCommentsLocked).toBe(true);
    });

    it('should deny update to another user', async () => {
      const res = await request(app)
        .patch(`/api/users/${authorUserId}/profile-comment-settings`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ profileCommentsEnabled: false });
      expect(res.status).toBe(403);
    });

    it('should allow admin to update any user profile comment settings', async () => {
      const res = await request(app)
        .patch(`/api/users/${viewerUserId}/profile-comment-settings`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaders(adminUserId))
        .send({ profileCommentsEnabled: true, profileCommentsLocked: false });
      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .patch('/api/users/99999/profile-comment-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaders(adminUserId))
        .send({ profileCommentsEnabled: false });
      expect(res.status).toBe(404);
    });

    it('should block profile comments when profileCommentsEnabled=false', async () => {
      // viewerUserId has disabled comments now — wait, we re-enabled above.
      // Let's disable again for this test.
      await request(app)
        .patch(`/api/users/${viewerUserId}/profile-comment-settings`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ profileCommentsEnabled: false });

      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authorToken}`)
        .set(csrfHeaders(authorUserId))
        .send({ entityType: 'user_profile', entityId: viewerUserId, body: 'Disabled comment' });
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/disabled/i);

      // Re-enable for subsequent tests
      await request(app)
        .patch(`/api/users/${viewerUserId}/profile-comment-settings`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ profileCommentsEnabled: true, profileCommentsLocked: false });
    });
    it('should allow user to update searchable via profile settings', async () => {
      const res = await request(app)
        .patch(`/api/users/${viewerUserId}/profile-comment-settings`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ searchable: false });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.searchable).toBe(false);

      // Restore searchable
      await request(app)
        .patch(`/api/users/${viewerUserId}/profile-comment-settings`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ searchable: true });
    });

    it('should update all three profile settings at once', async () => {
      const res = await request(app)
        .patch(`/api/users/${viewerUserId}/profile-comment-settings`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ profileCommentsEnabled: true, profileCommentsLocked: false, searchable: true });
      expect(res.status).toBe(200);
      expect(res.body.data.profileCommentsEnabled).toBe(true);
      expect(res.body.data.profileCommentsLocked).toBe(false);
      expect(res.body.data.searchable).toBe(true);
    });

    it('should exclude non-searchable users from search results', async () => {
      // Set viewer as non-searchable
      await request(app)
        .patch(`/api/users/${viewerUserId}/profile-comment-settings`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ searchable: false });

      const res = await request(app)
        .get('/api/auth/users/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'viewer' });
      expect(res.status).toBe(200);
      const ids = (res.body.data?.users || []).map((u) => u.id);
      expect(ids).not.toContain(viewerUserId);

      // Restore searchable
      await request(app)
        .patch(`/api/users/${viewerUserId}/profile-comment-settings`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ searchable: true });
    });
  });

  describe('Max depth enforcement (depth=5)', () => {
    it('should reject a reply that would exceed max depth', async () => {
      // Re-unlock the article for this test
      await request(app)
        .patch(`/api/articles/${testArticleId}/comment-settings`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaders(adminUserId))
        .send({ commentsEnabled: true, commentsLocked: false });

      // Build a chain: depth 1 -> 2 -> 3 -> 4 -> 5
      let parentId = null;
      for (let depth = 1; depth <= 5; depth++) {
        const payload = { entityType: 'article', entityId: testArticleId, body: `Depth ${depth}` };
        if (parentId) payload.parentId = parentId;
        const res = await request(app)
          .post('/api/comments')
          .set('Authorization', `Bearer ${viewerToken}`)
          .set(csrfHeaders(viewerUserId))
          .send(payload);
        expect(res.status).toBe(201);
        parentId = res.body.data.comment.id;
      }

      // Depth 6 should be rejected
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaders(viewerUserId))
        .send({ entityType: 'article', entityId: testArticleId, parentId, body: 'Too deep' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/depth/i);
    });
  });
});
