'use strict';

const mediaService = require('../services/mediaService');

function handleMulterError(error, res) {
  if (!error) return false;

  if (error.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ success: false, message: 'Image exceeds the per-file upload limit.' });
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
        quota: result.quota,
      });
    } catch (error) {
      console.error('mediaController.listMedia error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch media.' });
    }
  },

  uploadMedia: async (req, res) => {
    try {
      if (handleMulterError(req.fileValidationError, res)) return;

      const result = await mediaService.uploadMediaAsset(req.file, req.user, req.body || {});
      if (!result.success) {
        return res.status(result.status).json({ success: false, message: result.message, quota: result.quota });
      }

      return res.status(201).json({ success: true, media: result.media, quota: result.quota });
    } catch (error) {
      console.error('mediaController.uploadMedia error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to upload image.' });
    }
  },

  getMediaById: async (req, res) => {
    try {
      const result = await mediaService.getMediaAssetById(req.params.id, req.user);
      if (!result.success) {
        return res.status(result.status).json({ success: false, message: result.message });
      }

      return res.status(200).json({ success: true, media: result.media });
    } catch (error) {
      console.error('mediaController.getMediaById error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch media details.' });
    }
  },

  updateMedia: async (req, res) => {
    try {
      const result = await mediaService.updateMediaAssetMetadata(req.params.id, req.user, req.body || {});
      if (!result.success) {
        return res.status(result.status).json({ success: false, message: result.message });
      }

      return res.status(200).json({ success: true, media: result.media });
    } catch (error) {
      console.error('mediaController.updateMedia error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to update media.' });
    }
  },

  deleteMedia: async (req, res) => {
    try {
      const result = await mediaService.deleteMediaAsset(req.params.id, req.user, { force: req.query.force === 'true' });
      if (!result.success) {
        return res.status(result.status).json({
          success: false,
          message: result.message,
          references: result.references,
          referenceSummary: result.referenceSummary,
          blockers: result.blockers,
        });
      }

      return res.status(200).json({ success: true, id: result.id });
    } catch (error) {
      console.error('mediaController.deleteMedia error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to delete media.' });
    }
  },

  getAdminStats: async (req, res) => {
    try {
      const result = await mediaService.getAdminMediaStats(req.user);
      if (!result.success) {
        return res.status(result.status).json({ success: false, message: result.message });
      }
      return res.status(200).json({ success: true, stats: result.stats });
    } catch (error) {
      console.error('mediaController.getAdminStats error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch media statistics.' });
    }
  },

  getAdminSchemaHealth: async (req, res) => {
    try {
      const result = await mediaService.getAdminMediaSchemaHealth(req.user);
      if (!result.success) {
        return res.status(result.status).json({ success: false, message: result.message });
      }
      return res.status(200).json({ success: true, health: result.health });
    } catch (error) {
      console.error('mediaController.getAdminSchemaHealth error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to inspect media schema.' });
    }
  },

  getAdminCleanupReport: async (req, res) => {
    try {
      const result = await mediaService.getAdminCleanupReport(req.user, req.query || {});
      if (!result.success) {
        return res.status(result.status).json({ success: false, message: result.message });
      }
      return res.status(200).json({ success: true, report: result.report });
    } catch (error) {
      console.error('mediaController.getAdminCleanupReport error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to generate cleanup report.' });
    }
  },

  runAdminCleanup: async (req, res) => {
    try {
      const result = await mediaService.runAdminMediaCleanup(req.user, req.body || {});
      if (!result.success) {
        return res.status(result.status).json({ success: false, message: result.message });
      }
      return res.status(200).json({ success: true, report: result.report });
    } catch (error) {
      console.error('mediaController.runAdminCleanup error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to run media cleanup.' });
    }
  },
};

module.exports = mediaController;
