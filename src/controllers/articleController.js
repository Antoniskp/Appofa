const { Article, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { ARTICLE_TYPES } = require('../constants/articleTypes');
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

// Helper functions using shared validators
const normalizeStatus = (status) => normalizeEnum(status, ARTICLE_STATUSES, 'Status');
const normalizeType = (type) => normalizeEnum(type, ARTICLE_TYPES, 'Article type');
const normalizeTags = (tags) => normalizeStringArray(tags, 'Tags');
const normalizeBannerImageUrl = (value) => normalizeUrl(value, 'Banner image URL', true);

const articleController = {
  // Create a new article
  createArticle: async (req, res) => {
    try {
      const { title, content, summary, category, status, isNews, type, tags, bannerImageUrl } = req.body;

      const titleResult = normalizeRequiredText(title, 'Title', TITLE_MIN_LENGTH, TITLE_MAX_LENGTH);
      if (titleResult.error) {
        return res.status(400).json({
          success: false,
          message: titleResult.error
        });
      }

      const contentResult = normalizeRequiredText(content, 'Content', CONTENT_MIN_LENGTH, CONTENT_MAX_LENGTH);
      if (contentResult.error) {
        return res.status(400).json({
          success: false,
          message: contentResult.error
        });
      }

      const summaryResult = normalizeOptionalText(summary, 'Summary', null, SUMMARY_MAX_LENGTH);
      if (summaryResult.error) {
        return res.status(400).json({
          success: false,
          message: summaryResult.error
        });
      }

      const categoryResult = normalizeOptionalText(category, 'Category', null, 100);
      if (categoryResult.error) {
        return res.status(400).json({
          success: false,
          message: categoryResult.error
        });
      }

      const statusResult = normalizeStatus(status);
      if (statusResult.error) {
        return res.status(400).json({
          success: false,
          message: statusResult.error
        });
      }

      const typeResult = normalizeType(type);
      if (typeResult.error) {
        return res.status(400).json({
          success: false,
          message: typeResult.error
        });
      }

      const isNewsResult = normalizeBoolean(isNews, 'isNews');
      if (isNewsResult.error) {
        return res.status(400).json({
          success: false,
          message: isNewsResult.error
        });
      }

      const tagsResult = normalizeTags(tags);
      if (tagsResult.error) {
        return res.status(400).json({
          success: false,
          message: tagsResult.error
        });
      }

      const bannerImageResult = normalizeBannerImageUrl(bannerImageUrl);
      if (bannerImageResult.error) {
        return res.status(400).json({
          success: false,
          message: bannerImageResult.error
        });
      }

      // Determine article type - support both old isNews and new type field
      let articleType = typeResult.value || 'personal';
      if (isNewsResult.value && !typeResult.value) {
        articleType = 'news';
      }

      const resolvedBannerImageUrl = bannerImageResult.value ?? DEFAULT_BANNER_IMAGE_URL;
      const resolvedStatus = statusResult.value || 'draft';

      // Create article
      const article = await Article.create({
        title: titleResult.value,
        content: contentResult.value,
        summary: summaryResult.value,
        category: categoryResult.value,
        tags: tagsResult.value ?? [],
        status: resolvedStatus,
        authorId: req.user.id,
        publishedAt: resolvedStatus === 'published' ? new Date() : null,
        type: articleType,
        isNews: articleType === 'news' || isNewsResult.value,
        bannerImageUrl: resolvedBannerImageUrl
      });

      // Fetch article with author info
      const articleWithAuthor = await Article.findByPk(article.id, {
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }]
      });

      res.status(201).json({
        success: true,
        message: 'Article created successfully.',
        data: { article: articleWithAuthor }
      });
    } catch (error) {
      console.error('Create article error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating article.'
      });
    }
  },

  // Get all articles
  getAllArticles: async (req, res) => {
    try {
      const { status, category, page = 1, limit = 10, authorId, type, tag } = req.query;
      
      // Validate pagination parameters
      const parsedPage = Number(page);
      const parsedLimit = Number(limit);
      
      if (!Number.isInteger(parsedPage) || parsedPage < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid page parameter.'
        });
      }
      
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid limit parameter. Must be between 1 and 100.'
        });
      }
      
      const where = {};
      
      // Filter by status (default to published for non-authenticated users)
      if (status) {
        where.status = status;
      } else if (!req.user) {
        where.status = 'published';
      }
      
      // Filter by category
      if (category) {
        where.category = category;
      }

      // Filter by article type
      if (type) {
        where.type = type;
        if (type === 'news') {
          where.newsApprovedAt = {
            [Op.ne]: null
          };
        }
      }

      if (authorId !== undefined) {
        const parsedAuthorId = Number(authorId);
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required.'
          });
        }
        if (!Number.isInteger(parsedAuthorId) || parsedAuthorId < 1) {
          return res.status(400).json({
            success: false,
            message: 'Invalid author ID.'
          });
        }
        if (req.user.role !== 'admin' && req.user.id !== parsedAuthorId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied.'
          });
        }
        where.authorId = parsedAuthorId;
      }

      const offset = (parsedPage - 1) * parsedLimit;

      // Filter by tag (dialect-aware fallback for non-Postgres databases)
      if (tag) {
        const trimmedTag = String(tag).trim();
        const dialect = sequelize.getDialect();

        if (trimmedTag && dialect !== 'postgres') {
          // Non-Postgres fallback uses in-memory filtering (intended for small datasets/testing).
          const allArticles = await Article.findAll({
            where,
            include: [{
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'firstName', 'lastName']
            }],
            order: [['createdAt', 'DESC']]
          });

          const filteredArticles = allArticles.filter(
            (article) => Array.isArray(article.tags) && article.tags.includes(trimmedTag)
          );
          const count = filteredArticles.length;
          const paginatedArticles = filteredArticles.slice(offset, offset + parsedLimit);

          return res.status(200).json({
            success: true,
            data: {
              articles: paginatedArticles,
              pagination: {
                total: count,
                page: parsedPage,
                limit: parsedLimit,
                totalPages: Math.ceil(count / parsedLimit)
              }
            }
          });
        }

        if (trimmedTag && dialect === 'postgres') {
          // Exact tag match for Postgres arrays.
          where.tags = { [Op.contains]: [trimmedTag] };
        }
      }

      const { count, rows: articles } = await Article.findAndCountAll({
        where,
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }],
        order: [['createdAt', 'DESC']],
        limit: parsedLimit,
        offset: parseInt(offset)
      });

      res.status(200).json({
        success: true,
        data: {
          articles,
          pagination: {
            total: count,
            page: parsedPage,
            limit: parsedLimit,
            totalPages: Math.ceil(count / parsedLimit)
          }
        }
      });
    } catch (error) {
      console.error('Get articles error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching articles.'
      });
    }
  },

  // Get single article by ID
  getArticleById: async (req, res) => {
    try {
      const { id } = req.params;

      const article = await Article.findByPk(id, {
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }]
      });

      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article not found.'
        });
      }

      // Check if user has permission to view unpublished articles
      if (article.status !== 'published' && (!req.user || (req.user.id !== article.authorId && req.user.role !== 'admin'))) {
        return res.status(403).json({
          success: false,
          message: 'Access denied.'
        });
      }

      res.status(200).json({
        success: true,
        data: { article }
      });
    } catch (error) {
      console.error('Get article error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching article.'
      });
    }
  },

  // Update article
  updateArticle: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, summary, category, status, isNews, type, tags, bannerImageUrl } = req.body;

      const article = await Article.findByPk(id);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article not found.'
        });
      }

      // Check permissions: author can edit their own, admin and editor can edit all
      if (article.authorId !== req.user.id && !['admin', 'editor'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this article.'
        });
      }

      const titleResult = normalizeOptionalText(title, 'Title', TITLE_MIN_LENGTH, TITLE_MAX_LENGTH);
      if (titleResult.error) {
        return res.status(400).json({
          success: false,
          message: titleResult.error
        });
      }
      if (titleResult.value !== undefined && titleResult.value !== null) {
        article.title = titleResult.value;
      }

      const contentResult = normalizeOptionalText(content, 'Content', CONTENT_MIN_LENGTH, CONTENT_MAX_LENGTH);
      if (contentResult.error) {
        return res.status(400).json({
          success: false,
          message: contentResult.error
        });
      }
      if (contentResult.value !== undefined && contentResult.value !== null) {
        article.content = contentResult.value;
      }

      const summaryResult = normalizeOptionalText(summary, 'Summary', null, SUMMARY_MAX_LENGTH);
      if (summaryResult.error) {
        return res.status(400).json({
          success: false,
          message: summaryResult.error
        });
      }
      if (summaryResult.value !== undefined) {
        article.summary = summaryResult.value;
      }

      const categoryResult = normalizeOptionalText(category, 'Category', null, 100);
      if (categoryResult.error) {
        return res.status(400).json({
          success: false,
          message: categoryResult.error
        });
      }
      if (categoryResult.value !== undefined) {
        article.category = categoryResult.value;
      }

      const statusResult = normalizeStatus(status);
      if (statusResult.error) {
        return res.status(400).json({
          success: false,
          message: statusResult.error
        });
      }
      if (statusResult.value) {
        article.status = statusResult.value;
        if (statusResult.value === 'published' && !article.publishedAt) {
          article.publishedAt = new Date();
        }
      }

      const tagsResult = normalizeTags(tags);
      if (tagsResult.error) {
        return res.status(400).json({
          success: false,
          message: tagsResult.error
        });
      }
      if (tagsResult.value !== undefined) {
        article.tags = tagsResult.value;
      }

      if (bannerImageUrl !== undefined) {
        const bannerImageResult = normalizeBannerImageUrl(bannerImageUrl);
        if (bannerImageResult.error) {
          return res.status(400).json({
            success: false,
            message: bannerImageResult.error
          });
        }
        article.bannerImageUrl = bannerImageResult.value ?? DEFAULT_BANNER_IMAGE_URL;
      }

      const typeResult = normalizeType(type);
      if (typeResult.error) {
        return res.status(400).json({
          success: false,
          message: typeResult.error
        });
      }

      // Update article type
      if (typeResult.value) {
        article.type = typeResult.value;
        // Keep isNews in sync with type for backward compatibility
        article.isNews = typeResult.value === 'news';

        // Clear approval if changing away from news
        if (typeResult.value !== 'news') {
          article.newsApprovedAt = null;
          article.newsApprovedBy = null;
        }
      }

      // Allow author, admin, editor, or moderator to set/unset isNews flag (legacy support)
      const canModifyNewsFlag = article.authorId === req.user.id || ['admin', 'editor', 'moderator'].includes(req.user.role);
      const isNewsResult = normalizeBoolean(isNews, 'isNews');
      if (isNewsResult.error) {
        return res.status(400).json({
          success: false,
          message: isNewsResult.error
        });
      }
      if (isNewsResult.value !== undefined && typeResult.value === undefined && canModifyNewsFlag) {
        article.isNews = isNewsResult.value;
        article.type = isNewsResult.value ? 'news' : 'personal';
        // Clear approval if user unflags as news
        if (!isNewsResult.value) {
          article.newsApprovedAt = null;
          article.newsApprovedBy = null;
        }
      }

      await article.save();

      // Fetch updated article with author info
      const updatedArticle = await Article.findByPk(id, {
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }]
      });

      res.status(200).json({
        success: true,
        message: 'Article updated successfully.',
        data: { article: updatedArticle }
      });
    } catch (error) {
      console.error('Update article error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating article.'
      });
    }
  },

  // Delete article
  deleteArticle: async (req, res) => {
    try {
      const { id } = req.params;

      const article = await Article.findByPk(id);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article not found.'
        });
      }

      // Check permissions: author can delete their own, admin can delete all
      if (article.authorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this article.'
        });
      }

      await article.destroy();

      res.status(200).json({
        success: true,
        message: 'Article deleted successfully.'
      });
    } catch (error) {
      console.error('Delete article error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting article.'
      });
    }
  },

  // Approve article as news (moderator/admin only)
  approveNews: async (req, res) => {
    try {
      const { id } = req.params;

      const article = await Article.findByPk(id);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article not found.'
        });
      }

      // Check if article is flagged as news
      if (!article.isNews && article.type !== 'news') {
        return res.status(400).json({
          success: false,
          message: 'Article is not flagged as news.'
        });
      }

      // Approve news and publish article
      article.newsApprovedAt = new Date();
      article.newsApprovedBy = req.user.id;
      article.status = 'published';
      if (!article.publishedAt) {
        article.publishedAt = new Date();
      }

      await article.save();

      // Fetch updated article with author and approver info
      const updatedArticle = await Article.findByPk(id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'firstName', 'lastName']
          }
        ]
      });

      res.status(200).json({
        success: true,
        message: 'News approved and published successfully.',
        data: { article: updatedArticle }
      });
    } catch (error) {
      console.error('Approve news error:', error);
      res.status(500).json({
        success: false,
        message: 'Error approving news.'
      });
    }
  }
};

module.exports = articleController;
