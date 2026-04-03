'use strict';

const articleService = require('../services/articleService');
const badgeService = require('../services/badgeService');

const toUserObj = (reqUser) =>
  reqUser ? { id: reqUser.id, role: reqUser.role } : null;

const articleController = {
  // Create a new article
  createArticle: async (req, res) => {
    const result = await articleService.createArticle(req.user.id, req.user.role, req.body);
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }
    const responseArticle = articleService.sanitizeArticle(result.data.article, toUserObj(req.user));
    if (result.data.article.status === 'published') {
      badgeService.evaluate(req.user.id).catch(err => console.error('Badge evaluation error:', err));
    }
    return res.status(201).json({
      success: true,
      message: 'Article created successfully.',
      data: { article: responseArticle }
    });
  },

  // Get all articles
  getAllArticles: async (req, res) => {
    const result = await articleService.getAllArticles(req.query, toUserObj(req.user));
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }
    return res.status(200).json({ success: true, data: result.data });
  },

  // Get single article by ID
  getArticleById: async (req, res) => {
    const result = await articleService.getArticleById(req.params.id, toUserObj(req.user));
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }
    return res.status(200).json({ success: true, data: result.data });
  },

  // Update article
  updateArticle: async (req, res) => {
    const result = await articleService.updateArticle(req.params.id, toUserObj(req.user), req.body);
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }
    const responseArticle = articleService.sanitizeArticle(result.data.article, toUserObj(req.user));
    if (result.data.article.status === 'published') {
      badgeService.evaluate(req.user.id).catch(err => console.error('Badge evaluation error:', err));
    }
    return res.status(200).json({
      success: true,
      message: 'Article updated successfully.',
      data: { article: responseArticle }
    });
  },

  // Delete article
  deleteArticle: async (req, res) => {
    const result = await articleService.deleteArticle(req.params.id, toUserObj(req.user));
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }
    return res.status(200).json({ success: true, message: 'Article deleted successfully.' });
  },

  // Get article counts grouped by category
  getCategoryCounts: async (req, res) => {
    const result = await articleService.getCategoryCounts(req.query);
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }
    return res.status(200).json(result);
  },

  // Approve article as news (moderator/admin only)
  approveNews: async (req, res) => {
    const result = await articleService.approveNews(req.params.id, toUserObj(req.user));
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }
    const responseArticle = articleService.sanitizeArticle(result.data.article, toUserObj(req.user));
    return res.status(200).json({
      success: true,
      message: 'News approved and published successfully.',
      data: { article: responseArticle }
    });
  }
};

module.exports = articleController;
