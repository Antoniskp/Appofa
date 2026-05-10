const newsletterService = require('../services/newsletterService');

const newsletterController = {
  subscribe: async (req, res) => {
    try {
      const result = await newsletterService.subscribePublic(req.body || {});
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Newsletter subscribe error:', error);
      return res.status(500).json({ success: false, message: 'Error subscribing to newsletter.' });
    }
  },

  unsubscribe: async (req, res) => {
    try {
      const token = req.body?.token || req.query?.token;
      const result = await newsletterService.unsubscribePublic(token);
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Newsletter unsubscribe error:', error);
      return res.status(500).json({ success: false, message: 'Error unsubscribing from newsletter.' });
    }
  },

  adminListSubscribers: async (req, res) => {
    try {
      const data = await newsletterService.listSubscribers(req.query || {});
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Newsletter admin list error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching subscribers.' });
    }
  },

  adminStats: async (_req, res) => {
    try {
      const data = await newsletterService.getAdminStats();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Newsletter admin stats error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching newsletter stats.' });
    }
  },

  adminAddSubscriber: async (req, res) => {
    try {
      const { subscriber, created } = await newsletterService.addSubscriberByAdmin(req.body || {}, req.user.id);
      return res.status(created ? 201 : 200).json({
        success: true,
        message: created ? 'Subscriber added successfully.' : 'Subscriber updated successfully.',
        data: { subscriber, created },
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Newsletter admin add error:', error);
      return res.status(500).json({ success: false, message: 'Error saving subscriber.' });
    }
  },

  adminBulkAddSubscribers: async (req, res) => {
    try {
      const summary = await newsletterService.bulkAddSubscribersByAdmin(req.body || {}, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Bulk subscriber import completed.',
        data: summary,
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Newsletter bulk add error:', error);
      return res.status(500).json({ success: false, message: 'Error importing subscribers.' });
    }
  },

  adminUpdateSubscriber: async (req, res) => {
    try {
      const subscriber = await newsletterService.updateSubscriberByAdmin(req.params.id, req.body || {});
      return res.status(200).json({
        success: true,
        message: 'Subscriber updated successfully.',
        data: { subscriber },
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Newsletter admin update error:', error);
      return res.status(500).json({ success: false, message: 'Error updating subscriber.' });
    }
  },
};

module.exports = newsletterController;
