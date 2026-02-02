const { Article, User, Image, sequelize } = require('../models');
const { Op } = require('sequelize');
const { ARTICLE_TYPES } = require('../constants/articleTypes');

const articleController = {
  // Create a new article
  createArticle: async (req, res) => {
    try {
      const { title, content, summary, category, status, isNews, type, tags, introImageId } = req.body;

      // Validate required fields
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Title and content are required.'
        });
      }

      // Validate introImageId if provided
      if (introImageId) {
        const image = await Image.findByPk(introImageId);
        if (!image) {
          return res.status(400).json({
            success: false,
            message: 'Invalid introImageId. Image not found.'
          });
        }
        // Check if user owns the image or has appropriate permissions
        if (image.ownerId !== req.user.id && !['admin', 'editor', 'moderator'].includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to use this image.'
          });
        }
      }

      // Determine article type - support both old isNews and new type field
      let articleType = type || 'personal';
      if (isNews && !type) {
        articleType = 'news';
      }

      // Create article
      const article = await Article.create({
        title,
        content,
        summary,
        category,
        tags: Array.isArray(tags) ? tags : [],
        status: status || 'draft',
        authorId: req.user.id,
        publishedAt: status === 'published' ? new Date() : null,
        type: articleType,
        isNews: articleType === 'news' || isNews,
        introImageId: introImageId || null
      });

      // Fetch article with author info and intro image
      const articleWithAuthor = await Article.findByPk(article.id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'firstName', 'lastName']
          },
          {
            model: Image,
            as: 'introImage',
            attributes: ['id', 'url', 'title', 'width', 'height']
          }
        ]
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
        message: 'Error creating article.',
        error: error.message
      });
    }
  },

  // Get all articles
  getAllArticles: async (req, res) => {
    try {
      const { status, category, page = 1, limit = 10, authorId, type, tag } = req.query;
      
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
        if (!Number.isInteger(parsedAuthorId)) {
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

      const offset = (page - 1) * limit;
      const parsedLimit = parseInt(limit);

      // Filter by tag (dialect-aware fallback for non-Postgres databases)
      if (tag) {
        const trimmedTag = String(tag).trim();
        const dialect = sequelize.getDialect();

        if (trimmedTag && dialect !== 'postgres') {
          // Non-Postgres fallback uses in-memory filtering (intended for small datasets/testing).
          const allArticles = await Article.findAll({
            where,
            include: [
              {
                model: User,
                as: 'author',
                attributes: ['id', 'username', 'firstName', 'lastName']
              },
              {
                model: Image,
                as: 'introImage',
                attributes: ['id', 'url', 'title', 'width', 'height']
              }
            ],
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
                page: parseInt(page),
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
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'firstName', 'lastName']
          },
          {
            model: Image,
            as: 'introImage',
            attributes: ['id', 'url', 'title', 'width', 'height']
          }
        ],
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
            page: parseInt(page),
            limit: parsedLimit,
            totalPages: Math.ceil(count / parsedLimit)
          }
        }
      });
    } catch (error) {
      console.error('Get articles error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching articles.',
        error: error.message
      });
    }
  },

  // Get single article by ID
  getArticleById: async (req, res) => {
    try {
      const { id } = req.params;

      const article = await Article.findByPk(id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'firstName', 'lastName']
          },
          {
            model: Image,
            as: 'introImage',
            attributes: ['id', 'url', 'title', 'width', 'height']
          }
        ]
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
        message: 'Error fetching article.',
        error: error.message
      });
    }
  },

  // Update article
  updateArticle: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, summary, category, status, isNews, type, tags, introImageId } = req.body;

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

      // Validate introImageId if provided
      if (introImageId !== undefined) {
        if (introImageId === null) {
          // Allow removing the image
          article.introImageId = null;
        } else {
          const image = await Image.findByPk(introImageId);
          if (!image) {
            return res.status(400).json({
              success: false,
              message: 'Invalid introImageId. Image not found.'
            });
          }
          // Check if user owns the image or has appropriate permissions
          if (image.ownerId !== req.user.id && !['admin', 'editor', 'moderator'].includes(req.user.role)) {
            return res.status(403).json({
              success: false,
              message: 'You do not have permission to use this image.'
            });
          }
          article.introImageId = introImageId;
        }
      }

      // Update fields
      if (title) article.title = title;
      if (content) article.content = content;
      if (summary !== undefined) article.summary = summary;
      if (category !== undefined) article.category = category;
      if (status) {
        article.status = status;
        if (status === 'published' && !article.publishedAt) {
          article.publishedAt = new Date();
        }
      }
      if (tags !== undefined) {
        article.tags = Array.isArray(tags) ? tags : [];
      }
      
      // Update article type
      if (type !== undefined && ARTICLE_TYPES.includes(type)) {
        article.type = type;
        // Keep isNews in sync with type for backward compatibility
        article.isNews = type === 'news';
        
        // Clear approval if changing away from news
        if (type !== 'news') {
          article.newsApprovedAt = null;
          article.newsApprovedBy = null;
        }
      }
      
      // Allow author, admin, editor, or moderator to set/unset isNews flag (legacy support)
      const canModifyNewsFlag = article.authorId === req.user.id || ['admin', 'editor', 'moderator'].includes(req.user.role);
      if (isNews !== undefined && type === undefined && canModifyNewsFlag) {
        article.isNews = isNews;
        article.type = isNews ? 'news' : 'personal';
        // Clear approval if user unflags as news
        if (!isNews) {
          article.newsApprovedAt = null;
          article.newsApprovedBy = null;
        }
      }

      await article.save();

      // Fetch updated article with author info and intro image
      const updatedArticle = await Article.findByPk(id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'firstName', 'lastName']
          },
          {
            model: Image,
            as: 'introImage',
            attributes: ['id', 'url', 'title', 'width', 'height']
          }
        ]
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
        message: 'Error updating article.',
        error: error.message
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
        message: 'Error deleting article.',
        error: error.message
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
          },
          {
            model: Image,
            as: 'introImage',
            attributes: ['id', 'url', 'title', 'width', 'height']
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
        message: 'Error approving news.',
        error: error.message
      });
    }
  }
};

module.exports = articleController;
