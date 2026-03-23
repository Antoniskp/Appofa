const articleService = require('../services/articleService');

const articleController = {
  // Create a new article
  createArticle: async (req, res) => {
    try {
      const result = await articleService.createArticle(req.user.id, req.user.role, req.body);
      if (result.error) {
        return res.status(result.status).json({ success: false, message: result.error });
      }
      const responseArticle = articleService.sanitizeArticle(result.article, req.user);
      res.status(201).json({
        success: true,
        message: 'Article created successfully.',
        data: { article: responseArticle }
      });
    } catch (error) {
      console.error('Create article error:', error);
      res.status(500).json({ success: false, message: 'Error creating article.' });
    }
  },

  // Get all articles
  getAllArticles: async (req, res) => {
    try {
      const result = await articleService.getAllArticles(req.query, req.user);
      if (result.error) {
        return res.status(result.status).json({ success: false, message: result.error });
      }
      res.status(200).json({
        success: true,
        data: {
          articles: result.articles,
          pagination: result.pagination
        }
      });
    } catch (error) {
      console.error('Get articles error:', error);
      res.status(500).json({ success: false, message: 'Error fetching articles.' });
    }
  },

  // Get single article by ID
  getArticleById: async (req, res) => {
    try {
      const result = await articleService.getArticleById(req.params.id, req.user);
      if (result.error) {
        return res.status(result.status).json({ success: false, message: result.error });
      }
      res.status(200).json({
        success: true,
        data: { article: result.article }
      });
    } catch (error) {
      console.error('Get article error:', error);
      res.status(500).json({ success: false, message: 'Error fetching article.' });
    }
  },

  // Update article
  updateArticle: async (req, res) => {
    try {
      const result = await articleService.updateArticle(req.params.id, req.user, req.body);
      if (result.error) {
        return res.status(result.status).json({ success: false, message: result.error });
      }
      res.status(200).json({
        success: true,
        message: 'Article updated successfully.',
        data: { article: result.article }
      });
    } catch (error) {
      console.error('Update article error:', error);
      res.status(500).json({ success: false, message: 'Error updating article.' });
    }
  },

  // Delete article
  deleteArticle: async (req, res) => {
    try {
      const result = await articleService.deleteArticle(req.params.id, req.user);
      if (result.error) {
        return res.status(result.status).json({ success: false, message: result.error });
      }
      res.status(200).json({ success: true, message: 'Article deleted successfully.' });
    } catch (error) {
      console.error('Delete article error:', error);
      res.status(500).json({ success: false, message: 'Error deleting article.' });
    }
  },

  // Approve article as news (moderator/admin only)
  approveNews: async (req, res) => {
    try {
      const result = await articleService.approveNews(req.params.id, req.user.id);
      if (result.error) {
        return res.status(result.status).json({ success: false, message: result.error });
      }
      const responseArticle = articleService.sanitizeArticle(result.article, req.user);
      res.status(200).json({
        success: true,
        message: 'News approved and published successfully.',
        data: { article: responseArticle }
      });
    } catch (error) {
      console.error('Approve news error:', error);
      res.status(500).json({ success: false, message: 'Error approving news.' });
    }
  }
};

module.exports = articleController;
