'use strict';

const videoPinService = require('../services/videoPinService');

const toUserObj = (reqUser) =>
  reqUser ? { id: reqUser.id, role: reqUser.role } : null;

const videoPinController = {
  getVideoPins: async (req, res) => {
    const result = await videoPinService.getVideoPins(req.query, toUserObj(req.user));
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }
    return res.status(200).json({ success: true, data: result.data });
  },

  createVideoPin: async (req, res) => {
    const result = await videoPinService.createVideoPin(toUserObj(req.user), req.body);
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
        ...(result.data ? { data: result.data } : {})
      });
    }
    return res.status(201).json({
      success: true,
      message: result.data.videoPin.status === 'approved'
        ? 'Video pin added successfully.'
        : 'Video pin submitted for review.',
      data: result.data
    });
  },

  updateVideoPin: async (req, res) => {
    const result = await videoPinService.updateVideoPin(toUserObj(req.user), req.params.id, req.body);
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }
    return res.status(200).json({
      success: true,
      message: 'Video pin updated successfully.',
      data: result.data
    });
  },

  deleteVideoPin: async (req, res) => {
    const result = await videoPinService.removeVideoPin(toUserObj(req.user), req.params.id);
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }
    return res.status(200).json({ success: true, message: 'Video pin removed successfully.' });
  }
};

module.exports = videoPinController;
