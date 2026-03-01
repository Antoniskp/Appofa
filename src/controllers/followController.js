const { Follow, User } = require('../models');
const { normalizeInteger } = require('../utils/validators');

const FOLLOW_LIST_LIMIT = 20;

const resolveTargetUser = async (req, res) => {
  const idResult = normalizeInteger(req.params.id, 'User ID', 1);
  if (idResult.error) {
    res.status(400).json({ success: false, message: idResult.error });
    return null;
  }
  const targetId = idResult.value;
  const target = await User.findByPk(targetId, { attributes: ['id', 'searchable'] });
  if (!target) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return null;
  }
  return target;
};

const followController = {
  follow: async (req, res) => {
    try {
      const target = await resolveTargetUser(req, res);
      if (!target) return;

      if (target.id === req.user.id) {
        return res.status(400).json({ success: false, message: 'You cannot follow yourself.' });
      }

      const [, created] = await Follow.findOrCreate({
        where: { followerId: req.user.id, followingId: target.id }
      });

      return res.status(200).json({
        success: true,
        data: { following: true, created }
      });
    } catch (error) {
      console.error('Follow error:', error);
      return res.status(500).json({ success: false, message: 'Error following user.' });
    }
  },

  unfollow: async (req, res) => {
    try {
      const target = await resolveTargetUser(req, res);
      if (!target) return;

      if (target.id === req.user.id) {
        return res.status(400).json({ success: false, message: 'You cannot unfollow yourself.' });
      }

      const deleted = await Follow.destroy({
        where: { followerId: req.user.id, followingId: target.id }
      });

      return res.status(200).json({
        success: true,
        data: { following: false, deleted: deleted > 0 }
      });
    } catch (error) {
      console.error('Unfollow error:', error);
      return res.status(500).json({ success: false, message: 'Error unfollowing user.' });
    }
  },

  getStatus: async (req, res) => {
    try {
      const target = await resolveTargetUser(req, res);
      if (!target) return;

      const existing = await Follow.findOne({
        where: { followerId: req.user.id, followingId: target.id }
      });

      return res.status(200).json({
        success: true,
        data: { following: !!existing }
      });
    } catch (error) {
      console.error('Follow status error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching follow status.' });
    }
  },

  getCounts: async (req, res) => {
    try {
      const target = await resolveTargetUser(req, res);
      if (!target) return;

      const [followersCount, followingCount] = await Promise.all([
        Follow.count({ where: { followingId: target.id } }),
        Follow.count({ where: { followerId: target.id } })
      ]);

      return res.status(200).json({
        success: true,
        data: { followersCount, followingCount }
      });
    } catch (error) {
      console.error('Follow counts error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching follow counts.' });
    }
  },

  getFollowers: async (req, res) => {
    try {
      const target = await resolveTargetUser(req, res);
      if (!target) return;

      // Non-searchable user's lists are only visible to themselves
      if (!target.searchable && req.user.id !== target.id) {
        return res.status(403).json({ success: false, message: 'This profile is private.' });
      }

      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || FOLLOW_LIST_LIMIT));
      const offset = (page - 1) * limit;

      const { count, rows } = await Follow.findAndCountAll({
        where: { followingId: target.id },
        include: [{
          model: User,
          as: 'follower',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'avatarColor', 'role', 'searchable'],
          where: { searchable: true }
        }],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      const users = rows
        .map((row) => row.follower)
        .filter(Boolean)
        .map((u) => u.toJSON());

      return res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: limit
          }
        }
      });
    } catch (error) {
      console.error('Get followers error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching followers.' });
    }
  },

  getFollowing: async (req, res) => {
    try {
      const target = await resolveTargetUser(req, res);
      if (!target) return;

      // Non-searchable user's lists are only visible to themselves
      if (!target.searchable && req.user.id !== target.id) {
        return res.status(403).json({ success: false, message: 'This profile is private.' });
      }

      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || FOLLOW_LIST_LIMIT));
      const offset = (page - 1) * limit;

      const { count, rows } = await Follow.findAndCountAll({
        where: { followerId: target.id },
        include: [{
          model: User,
          as: 'followingUser',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'avatarColor', 'role', 'searchable'],
          where: { searchable: true }
        }],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      const users = rows
        .map((row) => row.followingUser)
        .filter(Boolean)
        .map((u) => u.toJSON());

      return res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: limit
          }
        }
      });
    } catch (error) {
      console.error('Get following error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching following list.' });
    }
  }
};

module.exports = followController;
