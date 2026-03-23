const { Article, User, LocationLink, sequelize } = require('../models');
const { Op } = require('sequelize');
const { ARTICLE_TYPES } = require('../constants/articleTypes');
const { getDescendantLocationIds } = require('../utils/locationUtils');
const {
  normalizeRequiredText,
  normalizeOptionalText,
  normalizeBoolean,
  normalizeStringArray,
  normalizeEnum,
  normalizeUrl
} = require('../utils/validators');

const DEFAULT_BANNER_IMAGE_URL = '/images/branding/news default.png';
const ARTICLE_STATUSES = ['draft', 'published', 'archived'];
const TITLE_MIN_LENGTH = 5;
const TITLE_MAX_LENGTH = 200;
const CONTENT_MIN_LENGTH = 10;
const CONTENT_MAX_LENGTH = 50000;
const SUMMARY_MAX_LENGTH = 500;

const shouldHideAuthor = (article, user) => {
  if (!article?.hideAuthor) return false;
  if (!user) return true;
  if (user.role === 'admin' || user.id === article.authorId) return false;
  return true;
};

const sanitizeArticle = (article, user) => {
  const data = article?.toJSON ? article.toJSON() : article;
  if (shouldHideAuthor(data, user)) {
    return {
      ...data,
      author: null
    };
  }
  return data;
};

const normalizeStatus = (status) => normalizeEnum(status, ARTICLE_STATUSES, 'Status');
const normalizeType = (type) => normalizeEnum(type, ARTICLE_TYPES, 'Article type');
const normalizeTags = (tags) => normalizeStringArray(tags, 'Tags');
const normalizeBannerImageUrl = (value) => normalizeUrl(value, 'Banner image URL', true);

/**
 * Check if a moderator can manage (update/delete) a given article.
 */
const canModeratorManageArticle = async (articleId, homeLocationId) => {
  if (!homeLocationId) return false;
  const manageableIds = await getDescendantLocationIds(homeLocationId, true);
  if (manageableIds.length === 0) return false;
  const link = await LocationLink.findOne({
    where: {
      entity_type: 'article',
      entity_id: articleId,
      location_id: { [Op.in]: manageableIds }
    }
  });
  return !!link;
};

/**
 * Create a new article.
 * Returns { error, status } on failure or { article } on success.
 */
const createArticle = async (userId, userRole, articleData) => {
  const {
    title, content, summary, category, status, isNews, type, tags,
    bannerImageUrl, hideAuthor, newsApproved,
    sourceUrl, sourceProvider, sourceMeta, embedUrl, embedHtml
  } = articleData;

  let resolvedSourceUrl = null;
  let resolvedSourceProvider = null;
  let resolvedSourceMeta = null;
  let resolvedEmbedUrl = null;
  let resolvedEmbedHtml = null;

  if (sourceUrl !== undefined && sourceUrl !== null && sourceUrl !== '') {
    const sourceUrlResult = normalizeUrl(sourceUrl, 'Source URL', true);
    if (sourceUrlResult.error) {
      return { error: sourceUrlResult.error, status: 400 };
    }
    resolvedSourceUrl = sourceUrlResult.value;

    const ALLOWED_PROVIDERS = ['youtube', 'tiktok'];
    if (sourceProvider && !ALLOWED_PROVIDERS.includes(sourceProvider)) {
      return { error: 'Invalid source provider.', status: 400 };
    }
    resolvedSourceProvider = sourceProvider || null;
    resolvedSourceMeta = (sourceMeta && typeof sourceMeta === 'object') ? sourceMeta : null;
    resolvedEmbedUrl = (embedUrl && typeof embedUrl === 'string') ? embedUrl.trim().slice(0, 2048) : null;
    resolvedEmbedHtml = (embedHtml && typeof embedHtml === 'string') ? embedHtml.slice(0, 65535) : null;
  }

  const autoTitle = resolvedSourceMeta?.title || null;
  const rawTitle = (title === undefined || title === null || String(title).trim() === '') ? autoTitle : title;

  const titleResult = normalizeRequiredText(rawTitle, 'Title', TITLE_MIN_LENGTH, TITLE_MAX_LENGTH);
  if (titleResult.error) return { error: titleResult.error, status: 400 };

  const rawContent = (content === undefined || content === null || String(content).trim() === '')
    ? (resolvedSourceUrl ? '' : content)
    : content;

  const contentResult = resolvedSourceUrl
    ? normalizeOptionalText(rawContent, 'Content', null, CONTENT_MAX_LENGTH)
    : normalizeRequiredText(rawContent, 'Content', CONTENT_MIN_LENGTH, CONTENT_MAX_LENGTH);
  if (contentResult.error) return { error: contentResult.error, status: 400 };

  const summaryResult = normalizeOptionalText(summary, 'Summary', null, SUMMARY_MAX_LENGTH);
  if (summaryResult.error) return { error: summaryResult.error, status: 400 };

  const categoryResult = normalizeOptionalText(category, 'Category', null, 100);
  if (categoryResult.error) return { error: categoryResult.error, status: 400 };

  const statusResult = normalizeStatus(status);
  if (statusResult.error) return { error: statusResult.error, status: 400 };

  const typeResult = normalizeType(type);
  if (typeResult.error) return { error: typeResult.error, status: 400 };

  const isNewsResult = normalizeBoolean(isNews, 'isNews');
  if (isNewsResult.error) return { error: isNewsResult.error, status: 400 };

  const tagsResult = normalizeTags(tags);
  if (tagsResult.error) return { error: tagsResult.error, status: 400 };

  const bannerImageResult = normalizeBannerImageUrl(bannerImageUrl);
  if (bannerImageResult.error) return { error: bannerImageResult.error, status: 400 };

  const hideAuthorResult = normalizeBoolean(hideAuthor, 'hideAuthor');
  if (hideAuthorResult.error) return { error: hideAuthorResult.error, status: 400 };

  let articleType = typeResult.value || 'personal';
  if (isNewsResult.value && !typeResult.value) {
    articleType = 'news';
  }

  const resolvedBannerImageUrl = bannerImageResult.value ?? DEFAULT_BANNER_IMAGE_URL;
  const resolvedStatus = statusResult.value || 'draft';

  const canApprove = ['admin', 'moderator'].includes(userRole);
  const newsApprovedResult = normalizeBoolean(newsApproved, 'newsApproved');
  const isPreApproved = canApprove && newsApprovedResult.value === true;

  const article = await Article.create({
    title: titleResult.value,
    content: contentResult.value ?? null,
    summary: summaryResult.value,
    category: categoryResult.value,
    tags: tagsResult.value ?? [],
    status: resolvedStatus,
    authorId: userId,
    publishedAt: resolvedStatus === 'published' ? new Date() : null,
    type: articleType,
    isNews: articleType === 'news' || isNewsResult.value,
    bannerImageUrl: resolvedBannerImageUrl,
    hideAuthor: hideAuthorResult.value !== undefined ? hideAuthorResult.value : false,
    newsApprovedAt: isPreApproved ? new Date() : null,
    newsApprovedBy: isPreApproved ? userId : null,
    sourceUrl: resolvedSourceUrl,
    sourceProvider: resolvedSourceProvider,
    sourceMeta: resolvedSourceMeta,
    embedUrl: resolvedEmbedUrl,
    embedHtml: resolvedEmbedHtml
  });

  const articleWithAuthor = await Article.findByPk(article.id, {
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'username', 'firstName', 'lastName']
    }]
  });

  return { article: articleWithAuthor };
};

/**
 * Get all articles with optional filters and pagination.
 * Returns { error, status } on failure or { articles, pagination } on success.
 */
const getAllArticles = async (query, user) => {
  const { status, category, page = 1, limit = 10, authorId, type, tag, orderBy, order, isNews, newsApproved, search } = query;

  const parsedPage = Number(page);
  const parsedLimit = Number(limit);

  if (!Number.isInteger(parsedPage) || parsedPage < 1) {
    return { error: 'Invalid page parameter.', status: 400 };
  }
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    return { error: 'Invalid limit parameter. Must be between 1 and 100.', status: 400 };
  }

  const where = {};

  if (status) {
    where.status = status;
  } else if (!user) {
    where.status = 'published';
  }

  if (category) {
    where.category = category;
  }

  if (type) {
    where.type = type;
    if (type === 'news') {
      where.newsApprovedAt = { [Op.ne]: null };
    }
  }

  const normalizedIsNews = typeof isNews === 'string' ? isNews.toLowerCase() : isNews;
  if (!type && (normalizedIsNews === true || normalizedIsNews === 'true' || normalizedIsNews === '1')) {
    where.type = 'news';
  }

  const normalizedNewsApproved = typeof newsApproved === 'string' ? newsApproved.toLowerCase() : newsApproved;
  if (normalizedNewsApproved === true || normalizedNewsApproved === 'true' || normalizedNewsApproved === '1') {
    where.newsApprovedAt = { [Op.ne]: null };
  }

  if (authorId !== undefined) {
    if (!user) {
      return { error: 'Authentication required.', status: 401 };
    }
    const parsedAuthorId = Number(authorId);
    if (!Number.isInteger(parsedAuthorId) || parsedAuthorId < 1) {
      return { error: 'Invalid author ID.', status: 400 };
    }
    if (user.role !== 'admin' && user.id !== parsedAuthorId) {
      where.status = 'published';
    }
    where.authorId = parsedAuthorId;
  }

  if (user) {
    where[Op.and] = (where[Op.and] || []).concat([{
      [Op.or]: [
        { type: { [Op.ne]: 'personal' } },
        { status: 'published' },
        { authorId: user.id }
      ]
    }]);
  }

  const offset = (parsedPage - 1) * parsedLimit;

  if (search) {
    const trimmedSearch = String(search).trim();
    if (trimmedSearch) {
      const dialect = sequelize.getDialect();
      if (dialect === 'postgres') {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${trimmedSearch}%` } },
          { summary: { [Op.iLike]: `%${trimmedSearch}%` } },
          { content: { [Op.iLike]: `%${trimmedSearch}%` } }
        ];
      } else {
        where[Op.or] = [
          { title: { [Op.like]: `%${trimmedSearch}%` } },
          { summary: { [Op.like]: `%${trimmedSearch}%` } },
          { content: { [Op.like]: `%${trimmedSearch}%` } }
        ];
      }
    }
  }

  let sortField = 'updatedAt';
  if (orderBy === 'title') sortField = 'title';
  else if (orderBy === 'createdAt') sortField = 'createdAt';
  else if (orderBy === 'updatedAt') sortField = 'updatedAt';
  else if (orderBy === 'newsApprovedAt') sortField = 'newsApprovedAt';
  let sortDirection = 'DESC';
  if (order && String(order).toLowerCase() === 'asc') sortDirection = 'ASC';

  const { count, rows: articles } = await Article.findAndCountAll({
    where,
    distinct: true,
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'username', 'firstName', 'lastName']
    }],
    order: [[sortField, sortDirection]],
    limit: parsedLimit,
    offset: parseInt(offset)
  });

  const sanitizedArticles = articles.map((article) => sanitizeArticle(article, user));

  return {
    articles: sanitizedArticles,
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(count / parsedLimit)
    }
  };
};

/**
 * Get a single article by ID.
 * Returns { error, status } on failure or { article } on success.
 */
const getArticleById = async (articleId, user) => {
  const article = await Article.findByPk(articleId, {
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'username', 'firstName', 'lastName']
    }]
  });

  if (!article) {
    return { error: 'Article not found.', status: 404 };
  }

  if (article.status !== 'published') {
    const isCreator = user && user.id === article.authorId;
    if (article.type === 'personal') {
      if (!isCreator) {
        return { error: 'Access denied.', status: 403 };
      }
    } else if (!isCreator && (!user || user.role !== 'admin')) {
      return { error: 'Access denied.', status: 403 };
    }
  }

  return { article: sanitizeArticle(article, user) };
};

/**
 * Update an article.
 * Returns { error, status } on failure or { article } on success.
 */
const updateArticle = async (articleId, user, updateData) => {
  const {
    title, content, summary, category, status, isNews, type, tags,
    bannerImageUrl, hideAuthor, newsApproved,
    sourceUrl, sourceProvider, sourceMeta, embedUrl, embedHtml
  } = updateData;

  const article = await Article.findByPk(articleId);

  if (!article) {
    return { error: 'Article not found.', status: 404 };
  }

  const isModerator = user.role === 'moderator';
  let moderatorAllowed = false;
  if (isModerator) {
    const moderatorUser = await User.findByPk(user.id, { attributes: ['homeLocationId'] });
    moderatorAllowed = await canModeratorManageArticle(articleId, moderatorUser?.homeLocationId);
  }
  if (article.authorId !== user.id && !['admin', 'editor'].includes(user.role) && !moderatorAllowed) {
    return { error: 'You do not have permission to update this article.', status: 403 };
  }

  const titleResult = normalizeOptionalText(title, 'Title', TITLE_MIN_LENGTH, TITLE_MAX_LENGTH);
  if (titleResult.error) return { error: titleResult.error, status: 400 };
  if (titleResult.value !== undefined && titleResult.value !== null) {
    article.title = titleResult.value;
  }

  const contentResult = normalizeOptionalText(content, 'Content', CONTENT_MIN_LENGTH, CONTENT_MAX_LENGTH);
  if (contentResult.error) return { error: contentResult.error, status: 400 };
  if (contentResult.value !== undefined && contentResult.value !== null) {
    article.content = contentResult.value;
  }

  const summaryResult = normalizeOptionalText(summary, 'Summary', null, SUMMARY_MAX_LENGTH);
  if (summaryResult.error) return { error: summaryResult.error, status: 400 };
  if (summaryResult.value !== undefined) {
    article.summary = summaryResult.value;
  }

  const categoryResult = normalizeOptionalText(category, 'Category', null, 100);
  if (categoryResult.error) return { error: categoryResult.error, status: 400 };
  if (categoryResult.value !== undefined) {
    article.category = categoryResult.value;
  }

  const statusResult = normalizeStatus(status);
  if (statusResult.error) return { error: statusResult.error, status: 400 };
  if (statusResult.value) {
    article.status = statusResult.value;
    if (statusResult.value === 'published' && !article.publishedAt) {
      article.publishedAt = new Date();
    }
  }

  const tagsResult = normalizeTags(tags);
  if (tagsResult.error) return { error: tagsResult.error, status: 400 };
  if (tagsResult.value !== undefined) {
    article.tags = tagsResult.value;
  }

  if (bannerImageUrl !== undefined) {
    const bannerImageResult = normalizeBannerImageUrl(bannerImageUrl);
    if (bannerImageResult.error) return { error: bannerImageResult.error, status: 400 };
    article.bannerImageUrl = bannerImageResult.value ?? DEFAULT_BANNER_IMAGE_URL;
  }

  if (hideAuthor !== undefined) {
    const hideAuthorResult = normalizeBoolean(hideAuthor, 'hideAuthor');
    if (hideAuthorResult.error) return { error: hideAuthorResult.error, status: 400 };
    article.hideAuthor = hideAuthorResult.value;
  }

  const typeResult = normalizeType(type);
  if (typeResult.error) return { error: typeResult.error, status: 400 };

  if (typeResult.value) {
    article.type = typeResult.value;
    article.isNews = typeResult.value === 'news';
    if (typeResult.value !== 'news') {
      article.newsApprovedAt = null;
      article.newsApprovedBy = null;
    }
  }

  const canModifyNewsFlag = article.authorId === user.id || ['admin', 'editor', 'moderator'].includes(user.role);
  const isNewsResult = normalizeBoolean(isNews, 'isNews');
  if (isNewsResult.error) return { error: isNewsResult.error, status: 400 };
  if (isNewsResult.value !== undefined && typeResult.value === undefined && canModifyNewsFlag) {
    article.isNews = isNewsResult.value;
    article.type = isNewsResult.value ? 'news' : 'personal';
    if (!isNewsResult.value) {
      article.newsApprovedAt = null;
      article.newsApprovedBy = null;
    }
  }

  if (['admin', 'moderator'].includes(user.role) && newsApproved !== undefined) {
    const newsApprovedResult = normalizeBoolean(newsApproved, 'newsApproved');
    if (newsApprovedResult.error) return { error: newsApprovedResult.error, status: 400 };
    if (newsApprovedResult.value === true) {
      article.newsApprovedAt = article.newsApprovedAt ?? new Date();
      article.newsApprovedBy = article.newsApprovedBy ?? user.id;
    } else if (newsApprovedResult.value === false) {
      article.newsApprovedAt = null;
      article.newsApprovedBy = null;
    }
  }

  if (sourceUrl !== undefined) {
    if (sourceUrl === null || sourceUrl === '') {
      article.sourceUrl = null;
      article.sourceProvider = null;
      article.sourceMeta = null;
      article.embedUrl = null;
      article.embedHtml = null;
    } else {
      const sourceUrlResult = normalizeUrl(sourceUrl, 'Source URL', true);
      if (sourceUrlResult.error) return { error: sourceUrlResult.error, status: 400 };
      const ALLOWED_PROVIDERS = ['youtube', 'tiktok'];
      if (sourceProvider && !ALLOWED_PROVIDERS.includes(sourceProvider)) {
        return { error: 'Invalid source provider.', status: 400 };
      }
      article.sourceUrl = sourceUrlResult.value;
      article.sourceProvider = sourceProvider || null;
      article.sourceMeta = (sourceMeta && typeof sourceMeta === 'object') ? sourceMeta : null;
      article.embedUrl = (embedUrl && typeof embedUrl === 'string') ? embedUrl.trim().slice(0, 2048) : null;
      article.embedHtml = (embedHtml && typeof embedHtml === 'string') ? embedHtml.slice(0, 65535) : null;

      if (title === undefined && article.sourceMeta?.title && !article.title) {
        article.title = String(article.sourceMeta.title).slice(0, TITLE_MAX_LENGTH);
      }
    }
  }

  await article.save();

  const updatedArticle = await Article.findByPk(articleId, {
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'username', 'firstName', 'lastName']
    }]
  });

  return { article: sanitizeArticle(updatedArticle, user) };
};

/**
 * Delete an article.
 * Returns { error, status } on failure or { success: true } on success.
 */
const deleteArticle = async (articleId, user) => {
  const article = await Article.findByPk(articleId);

  if (!article) {
    return { error: 'Article not found.', status: 404 };
  }

  const isModerator = user.role === 'moderator';
  let moderatorAllowed = false;
  if (isModerator) {
    const moderatorUser = await User.findByPk(user.id, { attributes: ['homeLocationId'] });
    moderatorAllowed = await canModeratorManageArticle(articleId, moderatorUser?.homeLocationId);
  }
  if (article.authorId !== user.id && user.role !== 'admin' && !moderatorAllowed) {
    return { error: 'You do not have permission to delete this article.', status: 403 };
  }

  await article.destroy();
  return { success: true };
};

/**
 * Approve an article as news.
 * Returns { error, status } on failure or { article } on success.
 */
const approveNews = async (articleId, approverId) => {
  const article = await Article.findByPk(articleId);

  if (!article) {
    return { error: 'Article not found.', status: 404 };
  }

  if (!article.isNews && article.type !== 'news') {
    return { error: 'Article is not flagged as news.', status: 400 };
  }

  article.newsApprovedAt = new Date();
  article.newsApprovedBy = approverId;
  article.status = 'published';
  if (!article.publishedAt) {
    article.publishedAt = new Date();
  }

  await article.save();

  const updatedArticle = await Article.findByPk(articleId, {
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'username', 'firstName', 'lastName']
    }]
  });

  return { article: updatedArticle };
};

module.exports = {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  approveNews,
  sanitizeArticle
};
