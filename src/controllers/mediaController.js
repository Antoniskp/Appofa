'use strict';

const mediaService = require('../services/mediaService');

function handleMulterError(error, res) {
  if (!error) return false;

  if (error.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ success: false, message: 'Image must be 8MB or smaller.' });
    return true;
  }

  res.status(400).json({ success: false, message: error.message || 'Invalid upload.' });
  return true;
}

const mediaController = {
  listMedia: async (req, res) => {
    try {
      const result = await mediaService.listMediaAssets(req.query, req.user);
      if (!result.success) {
        return res.status(result.status).json({ success: false, message: result.message });
      }

      return res.status(200).json({
        success: true,
        media: result.media,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('mediaController.listMedia error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch media.' });
    }
  },

  uploadArticleImage: async (req, res) => {
    try {
      if (handleMulterError(req.fileValidationError, res)) return;

      const result = await mediaService.uploadArticleImage(req.file, req.user, req.body || {});
      if (!result.success) {
        return res.status(result.status).json({ success: false, message: result.message });
      }

      return res.status(201).json({ success: true, media: result.media });
    } catch (error) {
      console.error('mediaController.uploadArticleImage error:', error);
      return res.status(500).json({ success: false, message: 'Failed to upload image.' });
    }
  },
};

module.exports = mediaController;
