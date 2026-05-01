const personService = require('../services/personService');
const { User } = require('../models');

const personController = {
  // GET /api/persons
  getPersons: async (req, res) => {
    try {
      const { page, limit, constituencyId, search, claimStatus, expertiseArea, locationId, domainId } = req.query;
      const data = await personService.getPersons({ page, limit, constituencyId, search, claimStatus, expertiseArea, locationId, domainId });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getPersons error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching persons.' });
    }
  },

  // GET /api/persons/profile/:id
  getProfileById: async (req, res) => {
    try {
      const profile = await personService.getPersonById(parseInt(req.params.id, 10));
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getProfileById error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching person profile.' });
    }
  },

  // GET /api/persons/search?search=...&limit=...
  searchPersons: async (req, res) => {
    try {
      const { search, limit } = req.query;
      const users = await personService.searchPersons(search, limit);
      return res.status(200).json({ success: true, data: { users } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('searchPersons error:', error);
      return res.status(500).json({ success: false, message: 'Error searching persons.' });
    }
  },

  // GET /api/persons/unified-search?search=...&limit=...&nationality=...
  unifiedSearch: async (req, res) => {
    try {
      const { search, limit, nationality } = req.query;
      const results = await personService.unifiedSearch(search, limit, nationality);
      return res.status(200).json({ success: true, data: { results } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('unifiedSearch error:', error);
      return res.status(500).json({ success: false, message: 'Error performing unified search.' });
    }
  },

  // GET /api/persons/:slug
  getPersonBySlug: async (req, res) => {
    try {
      const profile = await personService.getPersonBySlug(req.params.slug);
      return res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('getPersonBySlug error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching person.' });
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
      return res.status(500).json({ success: false, message: 'Error creating person profile.' });
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
      return res.status(500).json({ success: false, message: 'Error updating person profile.' });
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
      return res.status(500).json({ success: false, message: 'Error deleting person profile.' });
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

  // POST /api/persons/:id/photo
  uploadPersonPhoto: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }
      const { processAvatar } = require('../services/imageProcessingService');
      const { saveAvatar } = require('../services/imageStorageService');
      let optimizedBuffer;
      try {
        optimizedBuffer = await processAvatar(req.file.buffer);
      } catch (err) {
        console.error('Person photo processing failed:', err);
        const isHeic = /^image\/hei[cf](-sequence)?$/.test(req.file.mimetype || '');
        if (isHeic) {
          return res.status(422).json({
            success: false,
            message: 'HEIC/HEIF images could not be processed on this server. Please convert to JPEG, PNG, or WebP and try again.',
          });
        }
        return res.status(422).json({ success: false, message: 'Invalid or corrupt image.' });
      }
      const personId = parseInt(req.params.id, 10);
      const person = await User.findByPk(personId);
      if (!person || person.claimStatus === null) {
        return res.status(404).json({ success: false, message: 'Person profile not found.' });
      }
      const photoUrl = saveAvatar(optimizedBuffer, personId);
      person.photo = photoUrl;
      person.avatar = photoUrl;
      person.avatarUrl = photoUrl;
      person.avatarUpdatedAt = new Date();
      await person.save();
      return res.status(200).json({
        success: true,
        message: 'Photo uploaded successfully.',
        data: { photoUrl, avatarUpdatedAt: person.avatarUpdatedAt }
      });
    } catch (error) {
      console.error('uploadPersonPhoto error:', error);
      return res.status(500).json({ success: false, message: 'Error uploading person photo.' });
    }
  }
};

module.exports = personController;
