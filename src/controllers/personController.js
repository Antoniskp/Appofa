const personService = require('../services/personService');

const personController = {
  // GET /api/persons
  getCandidates: async (req, res) => {
    try {
      const { page, limit, constituencyId, search, claimStatus, position, activeOnly } = req.query;
      const data = await personService.getCandidates({ page, limit, constituencyId, search, claimStatus, position, activeOnly });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getCandidates error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching candidates.' });
    }
  },

  // GET /api/persons/profile/:id
  getProfileById: async (req, res) => {
    try {
      const profile = await personService.getCandidateById(parseInt(req.params.id, 10));
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getProfileById error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching candidate profile.' });
    }
  },

  // GET /api/persons/:slug
  getCandidateBySlug: async (req, res) => {
    try {
      const profile = await personService.getCandidateBySlug(req.params.slug);
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getCandidateBySlug error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching candidate.' });
    }
  },

  // POST /api/persons/apply
  submitApplication: async (req, res) => {
    try {
      const application = await personService.submitApplication(req.user.id, req.body);
      return res.status(201).json({ success: true, data: { application } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('submitApplication error:', error);
      return res.status(500).json({ success: false, message: 'Error submitting application.' });
    }
  },

  // GET /api/persons/my-application
  getMyApplication: async (req, res) => {
    try {
      const application = await personService.getMyApplication(req.user.id);
      return res.status(200).json({ success: true, data: { application } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getMyApplication error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching application.' });
    }
  },

  // GET /api/persons/dashboard
  getDashboard: async (req, res) => {
    try {
      const profile = await personService.getDashboard(req.user.id);
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getDashboard error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching dashboard.' });
    }
  },

  // POST /api/persons
  createProfile: async (req, res) => {
    try {
      const profile = await personService.createProfile(req.user.id, req.user.role, req.body);
      return res.status(201).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('createProfile error:', error);
      return res.status(500).json({ success: false, message: 'Error creating candidate profile.' });
    }
  },

  // PUT /api/persons/:id
  updateProfile: async (req, res) => {
    try {
      const profile = await personService.updateProfile(req.user.id, req.user.role, parseInt(req.params.id, 10), req.body);
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('updateProfile error:', error);
      return res.status(500).json({ success: false, message: 'Error updating candidate profile.' });
    }
  },

  // DELETE /api/persons/:id
  deleteProfile: async (req, res) => {
    try {
      const result = await personService.deleteProfile(req.user.id, req.user.role, parseInt(req.params.id, 10));
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('deleteProfile error:', error);
      return res.status(500).json({ success: false, message: 'Error deleting candidate profile.' });
    }
  },

  // POST /api/persons/:id/claim
  submitClaim: async (req, res) => {
    try {
      const { supportingStatement } = req.body;
      const profile = await personService.submitClaim(req.user.id, parseInt(req.params.id, 10), supportingStatement);
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('submitClaim error:', error);
      return res.status(500).json({ success: false, message: 'Error submitting claim.' });
    }
  },

  // GET /api/persons/applications
  getPendingApplications: async (req, res) => {
    try {
      const { page, limit } = req.query;
      const data = await personService.getPendingApplications(req.user.id, req.user.role, { page, limit });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getPendingApplications error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching applications.' });
    }
  },

  // GET /api/persons/applications/:id
  getApplicationById: async (req, res) => {
    try {
      const application = await personService.getApplicationById(req.user.id, req.user.role, parseInt(req.params.id, 10));
      return res.status(200).json({ success: true, data: { application } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getApplicationById error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching application.' });
    }
  },

  // POST /api/persons/applications/:id/approve
  approveApplication: async (req, res) => {
    try {
      const result = await personService.approveApplication(req.user.id, req.user.role, parseInt(req.params.id, 10));
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('approveApplication error:', error);
      return res.status(500).json({ success: false, message: 'Error approving application.' });
    }
  },

  // POST /api/persons/applications/:id/reject
  rejectApplication: async (req, res) => {
    try {
      const { rejectionReason } = req.body;
      const application = await personService.rejectApplication(req.user.id, req.user.role, parseInt(req.params.id, 10), rejectionReason);
      return res.status(200).json({ success: true, data: { application } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('rejectApplication error:', error);
      return res.status(500).json({ success: false, message: 'Error rejecting application.' });
    }
  },

  // GET /api/persons/claims
  getPendingClaims: async (req, res) => {
    try {
      const { page, limit } = req.query;
      const data = await personService.getPendingClaims(req.user.id, req.user.role, { page, limit });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getPendingClaims error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching claims.' });
    }
  },

  // POST /api/persons/claims/:id/approve
  approveClaim: async (req, res) => {
    try {
      const profile = await personService.approveClaim(req.user.id, req.user.role, parseInt(req.params.id, 10));
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('approveClaim error:', error);
      return res.status(500).json({ success: false, message: 'Error approving claim.' });
    }
  },

  // POST /api/persons/claims/:id/reject
  rejectClaim: async (req, res) => {
    try {
      const { reason } = req.body;
      const profile = await personService.rejectClaim(req.user.id, req.user.role, parseInt(req.params.id, 10), reason);
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('rejectClaim error:', error);
      return res.status(500).json({ success: false, message: 'Error rejecting claim.' });
    }
  },

  // POST /api/persons/:id/appoint
  appointAsCandidate: async (req, res) => {
    try {
      const profile = await personService.appointAsCandidate(req.user.id, req.user.role, parseInt(req.params.id, 10), req.body);
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('appointAsCandidate error:', error);
      return res.status(500).json({ success: false, message: 'Error appointing candidate.' });
    }
  },

  // POST /api/persons/:id/retire
  retireCandidate: async (req, res) => {
    try {
      const profile = await personService.retireCandidate(req.user.id, req.user.role, parseInt(req.params.id, 10));
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('retireCandidate error:', error);
      return res.status(500).json({ success: false, message: 'Error retiring candidate.' });
    }
  }
};

module.exports = personController;
