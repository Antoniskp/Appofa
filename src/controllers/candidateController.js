const candidateService = require('../services/candidateService');

const candidateController = {
  // GET /api/candidates
  getCandidates: async (req, res) => {
    try {
      const { page, limit, constituencyId, search, claimStatus, position, activeOnly } = req.query;
      const data = await candidateService.getCandidates({ page, limit, constituencyId, search, claimStatus, position, activeOnly });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getCandidates error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching candidates.' });
    }
  },

  // GET /api/candidates/profile/:id
  getProfileById: async (req, res) => {
    try {
      const profile = await candidateService.getCandidateById(parseInt(req.params.id, 10));
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getProfileById error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching candidate profile.' });
    }
  },

  // GET /api/candidates/:slug
  getCandidateBySlug: async (req, res) => {
    try {
      const profile = await candidateService.getCandidateBySlug(req.params.slug);
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getCandidateBySlug error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching candidate.' });
    }
  },

  // POST /api/candidates/apply
  submitApplication: async (req, res) => {
    try {
      const application = await candidateService.submitApplication(req.user.id, req.body);
      return res.status(201).json({ success: true, data: { application } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('submitApplication error:', error);
      return res.status(500).json({ success: false, message: 'Error submitting application.' });
    }
  },

  // GET /api/candidates/my-application
  getMyApplication: async (req, res) => {
    try {
      const application = await candidateService.getMyApplication(req.user.id);
      return res.status(200).json({ success: true, data: { application } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getMyApplication error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching application.' });
    }
  },

  // GET /api/candidates/dashboard
  getDashboard: async (req, res) => {
    try {
      const profile = await candidateService.getDashboard(req.user.id);
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getDashboard error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching dashboard.' });
    }
  },

  // POST /api/candidates
  createProfile: async (req, res) => {
    try {
      const profile = await candidateService.createProfile(req.user.id, req.user.role, req.body);
      return res.status(201).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('createProfile error:', error);
      return res.status(500).json({ success: false, message: 'Error creating candidate profile.' });
    }
  },

  // PUT /api/candidates/:id
  updateProfile: async (req, res) => {
    try {
      const profile = await candidateService.updateProfile(req.user.id, req.user.role, parseInt(req.params.id, 10), req.body);
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('updateProfile error:', error);
      return res.status(500).json({ success: false, message: 'Error updating candidate profile.' });
    }
  },

  // DELETE /api/candidates/:id
  deleteProfile: async (req, res) => {
    try {
      const result = await candidateService.deleteProfile(req.user.id, req.user.role, parseInt(req.params.id, 10));
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('deleteProfile error:', error);
      return res.status(500).json({ success: false, message: 'Error deleting candidate profile.' });
    }
  },

  // POST /api/candidates/:id/claim
  submitClaim: async (req, res) => {
    try {
      const { supportingStatement } = req.body;
      const profile = await candidateService.submitClaim(req.user.id, parseInt(req.params.id, 10), supportingStatement);
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('submitClaim error:', error);
      return res.status(500).json({ success: false, message: 'Error submitting claim.' });
    }
  },

  // GET /api/candidates/applications
  getPendingApplications: async (req, res) => {
    try {
      const { page, limit } = req.query;
      const data = await candidateService.getPendingApplications(req.user.id, req.user.role, { page, limit });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getPendingApplications error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching applications.' });
    }
  },

  // GET /api/candidates/applications/:id
  getApplicationById: async (req, res) => {
    try {
      const application = await candidateService.getApplicationById(req.user.id, req.user.role, parseInt(req.params.id, 10));
      return res.status(200).json({ success: true, data: { application } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getApplicationById error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching application.' });
    }
  },

  // POST /api/candidates/applications/:id/approve
  approveApplication: async (req, res) => {
    try {
      const result = await candidateService.approveApplication(req.user.id, req.user.role, parseInt(req.params.id, 10));
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('approveApplication error:', error);
      return res.status(500).json({ success: false, message: 'Error approving application.' });
    }
  },

  // POST /api/candidates/applications/:id/reject
  rejectApplication: async (req, res) => {
    try {
      const { rejectionReason } = req.body;
      const application = await candidateService.rejectApplication(req.user.id, req.user.role, parseInt(req.params.id, 10), rejectionReason);
      return res.status(200).json({ success: true, data: { application } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('rejectApplication error:', error);
      return res.status(500).json({ success: false, message: 'Error rejecting application.' });
    }
  },

  // GET /api/candidates/claims
  getPendingClaims: async (req, res) => {
    try {
      const { page, limit } = req.query;
      const data = await candidateService.getPendingClaims(req.user.id, req.user.role, { page, limit });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getPendingClaims error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching claims.' });
    }
  },

  // POST /api/candidates/claims/:id/approve
  approveClaim: async (req, res) => {
    try {
      const profile = await candidateService.approveClaim(req.user.id, req.user.role, parseInt(req.params.id, 10));
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('approveClaim error:', error);
      return res.status(500).json({ success: false, message: 'Error approving claim.' });
    }
  },

  // POST /api/candidates/claims/:id/reject
  rejectClaim: async (req, res) => {
    try {
      const { reason } = req.body;
      const profile = await candidateService.rejectClaim(req.user.id, req.user.role, parseInt(req.params.id, 10), reason);
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('rejectClaim error:', error);
      return res.status(500).json({ success: false, message: 'Error rejecting claim.' });
    }
  },

  // POST /api/candidates/:id/appoint
  appointAsCandidate: async (req, res) => {
    try {
      const profile = await candidateService.appointAsCandidate(req.user.id, req.user.role, parseInt(req.params.id, 10), req.body);
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('appointAsCandidate error:', error);
      return res.status(500).json({ success: false, message: 'Error appointing candidate.' });
    }
  },

  // POST /api/candidates/:id/retire
  retireCandidate: async (req, res) => {
    try {
      const profile = await candidateService.retireCandidate(req.user.id, req.user.role, parseInt(req.params.id, 10));
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('retireCandidate error:', error);
      return res.status(500).json({ success: false, message: 'Error retiring candidate.' });
    }
  }
};

module.exports = candidateController;
