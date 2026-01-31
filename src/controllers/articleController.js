const { Article, User } = require('../models');
const { Op } = require('sequelize');

const articleController = {
  // Create a new article
  createArticle: async (req, res) => {
    try {
      const { title, content, summary, category, status, isNews } = req.body;

      // Validate required fields
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Title and content are required.'
        });
      }

      // Create article
      const article = await Article.create({
        title,
        content,
        summary,
        category,
        status: status || 'draft',
        authorId: req.user.id,
        publishedAt: status === 'published' ? new Date() : null,
        isNews: isNews || false
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
        message: 'Error creating article.',
        error: error.message
      });
    }
  },

  // Get all articles
  getAllArticles: async (req, res) => {
    try {
      const { status, category, page = 1, limit = 10 } = req.query;
      
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

      const offset = (page - 1) * limit;

      const { count, rows: articles } = await Article.findAndCountAll({
        where,
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.status(200).json({
        success: true,
        data: {
          articles,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
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
        message: 'Error fetching article.',
        error: error.message
      });
    }
  },

  // Update article
  updateArticle: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, summary, category, status, isNews } = req.body;

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
      
      // Allow author, admin, editor, or moderator to set/unset isNews flag
      if (isNews !== undefined && (article.authorId === req.user.id || ['admin', 'editor', 'moderator'].includes(req.user.role))) {
        article.isNews = isNews;
        // Clear approval if user unflags as news
        if (!isNews) {
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
      if (!article.isNews) {
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
        message: 'Error approving news.',
        error: error.message
      });
    }
  }
};

module.exports = articleController;
