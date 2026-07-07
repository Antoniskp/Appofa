'use strict';

const topicService = require('../services/topicService');

const toUserObj = (reqUser) =>
  reqUser ? { id: reqUser.id, role: reqUser.role } : null;

const listTopics = async (req, res) => {
  try {
    const topics = await topicService.listTopics({
      q: req.query.q,
      limit: req.query.limit,
      includeHidden: req.query.includeHidden === 'true' && req.user?.role === 'admin',
      userId: req.user?.id || null
    });
    return res.json({ success: true, topics });
  } catch (error) {
    console.error('topicController.listTopics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch topics.' });
  }
};

const getTopic = async (req, res) => {
  try {
    const topic = await topicService.getTopicBySlug(req.params.slug, {
      includeHidden: req.query.includeHidden === 'true' && req.user?.role === 'admin',
      userId: req.user?.id || null
    });
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found.' });
    }
    return res.json({ success: true, topic });
  } catch (error) {
    console.error('topicController.getTopic error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch topic.' });
  }
};

const createTopic = async (req, res) => {
  const user = toUserObj(req.user);
  const result = await topicService.createTopic(req.body, user?.id);
  if (!result.success) {
    return res.status(result.status || 500).json({ success: false, message: result.message });
  }
  return res.status(201).json({ success: true, topic: result.data });
};

const updateTopic = async (req, res) => {
  const user = toUserObj(req.user);
  const result = await topicService.updateTopic(req.params.id, req.body, user?.id);
  if (!result.success) {
    return res.status(result.status || 500).json({ success: false, message: result.message });
  }
  return res.json({ success: true, topic: result.data });
};

const listFollowedTopics = async (req, res) => {
  try {
    const topics = await topicService.listFollowedTopics(req.user.id);
    return res.json({ success: true, topics });
  } catch (error) {
    console.error('topicController.listFollowedTopics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch followed topics.' });
  }
};

const followTopic = async (req, res) => {
  const result = await topicService.followTopic(req.params.slug, req.user?.id);
  if (!result.success) {
    return res.status(result.status || 500).json({ success: false, message: result.message });
  }
  return res.json({ success: true, topic: result.data });
};

const unfollowTopic = async (req, res) => {
  const result = await topicService.unfollowTopic(req.params.slug, req.user?.id);
  if (!result.success) {
    return res.status(result.status || 500).json({ success: false, message: result.message });
  }
  return res.json({ success: true, topic: result.data });
};

module.exports = {
  listTopics,
  getTopic,
  createTopic,
  updateTopic,
  listFollowedTopics,
  followTopic,
  unfollowTopic
};
