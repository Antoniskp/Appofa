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

  adminImportSubscribersCsv: async (req, res) => {
    try {
      const summary = await newsletterService.importSubscribersCsvByAdmin(req.body || {}, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'CSV import completed.',
        data: summary,
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Newsletter CSV import error:', error);
      return res.status(500).json({ success: false, message: 'Error importing subscribers CSV.' });
    }
  },

  adminExportSubscribersCsv: async (req, res) => {
    try {
      const { csv } = await newsletterService.exportSubscribersCsv(req.query || {});
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="newsletter-subscribers-${timestamp}.csv"`);
      return res.status(200).send(csv);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Newsletter CSV export error:', error);
      return res.status(500).json({ success: false, message: 'Error exporting subscribers CSV.' });
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

  adminListCampaigns: async (req, res) => {
    try {
      const data = await newsletterService.listCampaigns(req.query || {});
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Newsletter campaign list error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching campaigns.' });
    }
  },

  adminCreateCampaign: async (req, res) => {
    try {
      const campaign = await newsletterService.createCampaignDraft(req.body || {}, req.user.id);
      return res.status(201).json({
        success: true,
        message: 'Campaign draft created successfully.',
        data: { campaign },
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Newsletter campaign create error:', error);
      return res.status(500).json({ success: false, message: 'Error creating campaign.' });
    }
  },

  adminGetCampaign: async (req, res) => {
    try {
      const data = await newsletterService.getCampaignById(req.params.id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Newsletter campaign get error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching campaign.' });
    }
  },

  adminUpdateCampaign: async (req, res) => {
    try {
      const campaign = await newsletterService.updateCampaignDraft(req.params.id, req.body || {});
      return res.status(200).json({
        success: true,
        message: 'Campaign updated successfully.',
        data: { campaign },
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Newsletter campaign update error:', error);
      return res.status(500).json({ success: false, message: 'Error updating campaign.' });
    }
  },

  adminSendCampaignTest: async (req, res) => {
    try {
      const result = await newsletterService.sendCampaignTestEmail(req.params.id, req.body || {});
      return res.status(200).json({
        success: true,
        message: 'Test email sent successfully.',
        data: result,
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Newsletter campaign test-send error:', error);
      return res.status(500).json({ success: false, message: 'Error sending test email.' });
    }
  },

  adminSendCampaignNow: async (req, res) => {
    try {
      const result = await newsletterService.sendCampaignNow(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Campaign sent.',
        data: result,
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Newsletter campaign send error:', error);
      return res.status(500).json({ success: false, message: 'Error sending campaign.' });
    }
  },

  adminScheduleCampaign: async (req, res) => {
    try {
      const campaign = await newsletterService.scheduleCampaign(req.params.id, req.body || {});
      return res.status(200).json({
        success: true,
        message: 'Campaign scheduled successfully.',
        data: { campaign },
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Newsletter campaign schedule error:', error);
      return res.status(500).json({ success: false, message: 'Error scheduling campaign.' });
    }
  },

  adminProcessDueCampaigns: async (_req, res) => {
    try {
      const summary = await newsletterService.processDueScheduledCampaigns();
      return res.status(200).json({
        success: true,
        message: 'Due campaign processing completed.',
        data: summary,
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Newsletter due campaign processing error:', error);
      return res.status(500).json({ success: false, message: 'Error processing due campaigns.' });
    }
  },

  adminCampaignLogs: async (req, res) => {
    try {
      const data = await newsletterService.listCampaignSendLogs(req.params.id, req.query || {});
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Newsletter campaign logs error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching campaign logs.' });
    }
  },
};

module.exports = newsletterController;
