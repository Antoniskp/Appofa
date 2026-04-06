'use strict';

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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_BANNER_IMAGE_URL = '/images/branding/news default.png';
const ARTICLE_STATUSES = ['draft', 'published', 'archived'];
const TITLE_MIN_LENGTH = 5;
const TITLE_MAX_LENGTH = 200;
const CONTENT_MIN_LENGTH = 10;
const CONTENT_MAX_LENGTH = 50000;
const SUMMARY_MAX_LENGTH = 500;

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Create a new article.
 * @param {number} userId - ID of the authenticated creator
 * @param {string} userRole - role of the authenticated user
 * @param {object} articleData - fields from req.body
 * @returns {Promise<{success: boolean, status?: number, message?: string, data?: object}>}
 */
const createArticle = async (userId, userRole, articleData) => {
  try {
    const { title, content, summary, category, status, isNews, type, tags, bannerImageUrl, hideAuthor, newsApproved,
      sourceUrl, sourceProvider, sourceMeta, embedUrl, embedHtml } = articleData;

    // Validate sourceUrl if provided
    let resolvedSourceUrl = null;
    let resolvedSourceProvider = null;
    let resolvedSourceMeta = null;
    let resolvedEmbedUrl = null;
    let resolvedEmbedHtml = null;

    if (sourceUrl !== undefined && sourceUrl !== null && sourceUrl !== '') {
      const sourceUrlResult = normalizeUrl(sourceUrl, 'Source URL', true);
      if (sourceUrlResult.error) {
        return { success: false, status: 400, message: sourceUrlResult.error };
      }
      resolvedSourceUrl = sourceUrlResult.value;

      const ALLOWED_PROVIDERS = ['youtube', 'tiktok'];
      if (sourceProvider && !ALLOWED_PROVIDERS.includes(sourceProvider)) {
        return { success: false, status: 400, message: 'Invalid source provider.' };
      }
      resolvedSourceProvider = sourceProvider || null;
      resolvedSourceMeta = (sourceMeta && typeof sourceMeta === 'object') ? sourceMeta : null;
      resolvedEmbedUrl = (embedUrl && typeof embedUrl === 'string') ? embedUrl.trim().slice(0, 2048) : null;
      resolvedEmbedHtml = (embedHtml && typeof embedHtml === 'string') ? embedHtml.slice(0, 65535) : null;
    }

    const autoTitle = resolvedSourceMeta?.title || null;
    const rawTitle = (title === undefined || title === null || String(title).trim() === '') ? autoTitle : title;

    const titleResult = normalizeRequiredText(rawTitle, 'Title', TITLE_MIN_LENGTH, TITLE_MAX_LENGTH);
    if (titleResult.error) {
      return { success: false, status: 400, message: titleResult.error };
    }

    // Content is optional when a source URL is provided (existing behaviour for all
    // types, including the new 'video' type where the video link is the main content).
    const skipContentMin = !!resolvedSourceUrl;
    const rawContent = (content === undefined || content === null || String(content).trim() === '')
      ? (skipContentMin ? '' : content)
      : content;

    const contentResult = skipContentMin
      ? normalizeOptionalText(rawContent, 'Content', null, CONTENT_MAX_LENGTH)
      : normalizeRequiredText(rawContent, 'Content', CONTENT_MIN_LENGTH, CONTENT_MAX_LENGTH);
    if (contentResult.error) {
      return { success: false, status: 400, message: contentResult.error };
    }

    const summaryResult = normalizeOptionalText(summary, 'Summary', null, SUMMARY_MAX_LENGTH);
    if (summaryResult.error) {
      return { success: false, status: 400, message: summaryResult.error };
    }

    const categoryResult = normalizeOptionalText(category, 'Category', null, 100);
    if (categoryResult.error) {
      return { success: false, status: 400, message: categoryResult.error };
    }

    const statusResult = normalizeStatus(status);
    if (statusResult.error) {
      return { success: false, status: 400, message: statusResult.error };
    }

    const typeResult = normalizeType(type);
    if (typeResult.error) {
      return { success: false, status: 400, message: typeResult.error };
    }

    const isNewsResult = normalizeBoolean(isNews, 'isNews');
    if (isNewsResult.error) {
      return { success: false, status: 400, message: isNewsResult.error };
    }

    const tagsResult = normalizeTags(tags);
    if (tagsResult.error) {
      return { success: false, status: 400, message: tagsResult.error };
    }

    const bannerImageResult = normalizeBannerImageUrl(bannerImageUrl);
    if (bannerImageResult.error) {
      return { success: false, status: 400, message: bannerImageResult.error };
    }

    const hideAuthorResult = normalizeBoolean(hideAuthor, 'hideAuthor');
    if (hideAuthorResult.error) {
      return { success: false, status: 400, message: hideAuthorResult.error };
    }

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
        attributes: ['id', 'username', 'firstNameNative', 'lastNameNative']
      }]
    });

    return { success: true, data: { article: articleWithAuthor } };
  } catch (error) {
    console.error('Create article error:', error);
    return { success: false, status: 500, message: 'Error creating article.' };
  }
};

/**
 * Get all articles with filtering and pagination.
 * @param {object} queryParams - from req.query
 * @param {object|null} user - plain user object { id, role } or null
 * @returns {Promise<{success: boolean, status?: number, message?: string, data?: object}>}
 */
const getAllArticles = async (queryParams, user) => {
  try {
    const { status, category, page = 1, limit = 10, authorId, type, tag, orderBy, order, isNews, newsApproved, search, locationId } = queryParams;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      return { success: false, status: 400, message: 'Invalid page parameter.' };
    }

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return { success: false, status: 400, message: 'Invalid limit parameter. Must be between 1 and 100.' };
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
      const parsedAuthorId = Number(authorId);
      if (!user) {
        return { success: false, status: 401, message: 'Authentication required.' };
      }
      if (!Number.isInteger(parsedAuthorId) || parsedAuthorId < 1) {
        return { success: false, status: 400, message: 'Invalid author ID.' };
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

    // Filter by location (and its descendants) via LocationLink
    if (locationId) {
      const parsedLocationId = parseInt(locationId, 10);
      if (!isNaN(parsedLocationId)) {
        const locationIds = await getDescendantLocationIds(parsedLocationId, true);
        const linkedArticleIds = await LocationLink.findAll({
          where: { location_id: { [Op.in]: locationIds }, entity_type: 'article' },
          attributes: ['entity_id'],
          raw: true
        });
        // Use -1 sentinel when no matches to ensure an empty result set without SQL errors
        where.id = { [Op.in]: linkedArticleIds.length > 0 ? linkedArticleIds.map(l => l.entity_id) : [-1] };
      }
    }

    const { count, rows: articles } = await Article.findAndCountAll({
      where,
      distinct: true,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'firstNameNative', 'lastNameNative']
      }],
      order: [[sortField, sortDirection]],
      limit: parsedLimit,
      offset: parseInt(offset)
    });

    const sanitizedArticles = articles.map((article) => sanitizeArticle(article, user));

    return {
      success: true,
      data: {
        articles: sanitizedArticles,
        pagination: {
          total: count,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(count / parsedLimit)
        }
      }
    };
  } catch (error) {
    console.error('Get articles error:', error);
    return { success: false, status: 500, message: 'Error fetching articles.' };
  }
};

/**
 * Get a single article by ID.
 * @param {string|number} articleId - article primary key
 * @param {object|null} user - plain user object { id, role } or null
 * @returns {Promise<{success: boolean, status?: number, message?: string, data?: object}>}
 */
const getArticleById = async (articleId, user) => {
  try {
    const article = await Article.findByPk(articleId, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'firstNameNative', 'lastNameNative']
      }]
    });

    if (!article) {
      return { success: false, status: 404, message: 'Article not found.' };
    }

    if (article.status !== 'published') {
      const isCreator = user && user.id === article.authorId;
      if (article.type === 'personal') {
        if (!isCreator) {
          return { success: false, status: 403, message: 'Access denied.' };
        }
      } else if (!isCreator && (!user || user.role !== 'admin')) {
        return { success: false, status: 403, message: 'Access denied.' };
      }
    }

    const responseArticle = sanitizeArticle(article, user);
    return { success: true, data: { article: responseArticle } };
  } catch (error) {
    console.error('Get article error:', error);
    return { success: false, status: 500, message: 'Error fetching article.' };
  }
};

/**
 * Update an article.
 * @param {string|number} articleId - article primary key
 * @param {object} user - plain user object { id, role }
 * @param {object} updateData - fields from req.body
 * @returns {Promise<{success: boolean, status?: number, message?: string, data?: object}>}
 */
const updateArticle = async (articleId, user, updateData) => {
  try {
    const { title, content, summary, category, status, isNews, type, tags, bannerImageUrl, hideAuthor, newsApproved,
      sourceUrl, sourceProvider, sourceMeta, embedUrl, embedHtml } = updateData;

    const article = await Article.findByPk(articleId);

    if (!article) {
      return { success: false, status: 404, message: 'Article not found.' };
    }

    const isModerator = user.role === 'moderator';
    let moderatorAllowed = false;
    if (isModerator) {
      const moderatorUser = await User.findByPk(user.id, { attributes: ['homeLocationId'] });
      moderatorAllowed = await canModeratorManageArticle(articleId, moderatorUser?.homeLocationId);
    }
    if (article.authorId !== user.id && !['admin', 'editor'].includes(user.role) && !moderatorAllowed) {
      return { success: false, status: 403, message: 'You do not have permission to update this article.' };
    }

    const titleResult = normalizeOptionalText(title, 'Title', TITLE_MIN_LENGTH, TITLE_MAX_LENGTH);
    if (titleResult.error) {
      return { success: false, status: 400, message: titleResult.error };
    }
    if (titleResult.value !== undefined && titleResult.value !== null) {
      article.title = titleResult.value;
    }

    const effectiveType = type || article.type;
    const effectiveSourceUrl = sourceUrl !== undefined ? sourceUrl : article.sourceUrl;
    const isVideoWithSource = effectiveType === 'video' && effectiveSourceUrl;
    const contentMinLength = isVideoWithSource ? null : CONTENT_MIN_LENGTH;
    const contentResult = normalizeOptionalText(content, 'Content', contentMinLength, CONTENT_MAX_LENGTH);
    if (contentResult.error) {
      return { success: false, status: 400, message: contentResult.error };
    }
    if (contentResult.value !== undefined && contentResult.value !== null) {
      article.content = contentResult.value;
    }

    const summaryResult = normalizeOptionalText(summary, 'Summary', null, SUMMARY_MAX_LENGTH);
    if (summaryResult.error) {
      return { success: false, status: 400, message: summaryResult.error };
    }
    if (summaryResult.value !== undefined) {
      article.summary = summaryResult.value;
    }

    const categoryResult = normalizeOptionalText(category, 'Category', null, 100);
    if (categoryResult.error) {
      return { success: false, status: 400, message: categoryResult.error };
    }
    if (categoryResult.value !== undefined) {
      article.category = categoryResult.value;
    }

    const statusResult = normalizeStatus(status);
    if (statusResult.error) {
      return { success: false, status: 400, message: statusResult.error };
    }
    if (statusResult.value) {
      article.status = statusResult.value;
      if (statusResult.value === 'published' && !article.publishedAt) {
        article.publishedAt = new Date();
      }
    }

    const tagsResult = normalizeTags(tags);
    if (tagsResult.error) {
      return { success: false, status: 400, message: tagsResult.error };
    }
    if (tagsResult.value !== undefined) {
      article.tags = tagsResult.value;
    }

    if (bannerImageUrl !== undefined) {
      const bannerImageResult = normalizeBannerImageUrl(bannerImageUrl);
      if (bannerImageResult.error) {
        return { success: false, status: 400, message: bannerImageResult.error };
      }
      article.bannerImageUrl = bannerImageResult.value ?? DEFAULT_BANNER_IMAGE_URL;
    }

    if (hideAuthor !== undefined) {
      const hideAuthorResult = normalizeBoolean(hideAuthor, 'hideAuthor');
      if (hideAuthorResult.error) {
        return { success: false, status: 400, message: hideAuthorResult.error };
      }
      article.hideAuthor = hideAuthorResult.value;
    }

    const typeResult = normalizeType(type);
    if (typeResult.error) {
      return { success: false, status: 400, message: typeResult.error };
    }

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
    if (isNewsResult.error) {
      return { success: false, status: 400, message: isNewsResult.error };
    }
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
      if (newsApprovedResult.error) {
        return { success: false, status: 400, message: newsApprovedResult.error };
      }
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
        if (sourceUrlResult.error) {
          return { success: false, status: 400, message: sourceUrlResult.error };
        }
        const ALLOWED_PROVIDERS = ['youtube', 'tiktok'];
        if (sourceProvider && !ALLOWED_PROVIDERS.includes(sourceProvider)) {
          return { success: false, status: 400, message: 'Invalid source provider.' };
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
        attributes: ['id', 'username', 'firstNameNative', 'lastNameNative']
      }]
    });

    return { success: true, data: { article: updatedArticle } };
  } catch (error) {
    console.error('Update article error:', error);
    return { success: false, status: 500, message: 'Error updating article.' };
  }
};

/**
 * Delete an article.
 * @param {string|number} articleId - article primary key
 * @param {object} user - plain user object { id, role }
 * @returns {Promise<{success: boolean, status?: number, message?: string}>}
 */
const deleteArticle = async (articleId, user) => {
  try {
    const article = await Article.findByPk(articleId);

    if (!article) {
      return { success: false, status: 404, message: 'Article not found.' };
    }

    const isModerator = user.role === 'moderator';
    let moderatorAllowed = false;
    if (isModerator) {
      const moderatorUser = await User.findByPk(user.id, { attributes: ['homeLocationId'] });
      moderatorAllowed = await canModeratorManageArticle(articleId, moderatorUser?.homeLocationId);
    }
    if (article.authorId !== user.id && user.role !== 'admin' && !moderatorAllowed) {
      return { success: false, status: 403, message: 'You do not have permission to delete this article.' };
    }

    await article.destroy();
    return { success: true };
  } catch (error) {
    console.error('Delete article error:', error);
    return { success: false, status: 500, message: 'Error deleting article.' };
  }
};

/**
 * Approve an article as news.
 * @param {string|number} articleId - article primary key
 * @param {object} user - plain user object { id, role }
 * @returns {Promise<{success: boolean, status?: number, message?: string, data?: object}>}
 */
const approveNews = async (articleId, user) => {
  try {
    const article = await Article.findByPk(articleId);

    if (!article) {
      return { success: false, status: 404, message: 'Article not found.' };
    }

    if (!article.isNews && article.type !== 'news') {
      return { success: false, status: 400, message: 'Article is not flagged as news.' };
    }

    article.newsApprovedAt = new Date();
    article.newsApprovedBy = user.id;
    article.status = 'published';
    if (!article.publishedAt) {
      article.publishedAt = new Date();
    }

    await article.save();

    const updatedArticle = await Article.findByPk(articleId, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstNameNative', 'lastNameNative']
        }
      ]
    });

    return { success: true, data: { article: updatedArticle } };
  } catch (error) {
    console.error('Approve news error:', error);
    return { success: false, status: 500, message: 'Error approving news.' };
  }
};

/**
 * Get article counts grouped by category.
 * @param {object} queryParams - { type, status }
 * @returns {Promise<{success: boolean, data?: object, status?: number, message?: string}>}
 */
const getCategoryCounts = async (queryParams = {}) => {
  try {
    const { type, status = 'published' } = queryParams;

    const where = { category: { [Op.ne]: null } };
    if (type) where.type = type;
    if (status) where.status = status;

    const rows = await Article.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where,
      group: ['category'],
      raw: true
    });

    const counts = {};
    rows.forEach((row) => {
      if (row.category && row.category.trim()) {
        counts[row.category] = parseInt(row.count, 10);
      }
    });

    return { success: true, data: { counts } };
  } catch (error) {
    console.error('Get category counts error:', error);
    return { success: false, status: 500, message: 'Error fetching category counts.' };
  }
};

module.exports = {
  sanitizeArticle,
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  approveNews,
  getCategoryCounts
};
