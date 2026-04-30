'use strict';

const locationService = require('../services/locationService');
const { User, Location } = require('../models');

const toUserObj = (reqUser) =>
  reqUser ? { id: reqUser.id, role: reqUser.role, homeLocationId: reqUser.homeLocationId } : null;

// Create a new location (admin/moderator only)
exports.createLocation = async (req, res) => {
  const result = await locationService.createLocation(req.body);
  if (!result.success) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
      ...(result.error !== undefined && { error: result.error })
    });
  }
  return res.status(201).json({
    success: true,
    message: 'Location created successfully',
    location: result.location
  });
};

// Get all locations with optional filtering
exports.getLocations = async (req, res) => {
  const result = await locationService.getLocations(req.query);
  if (!result.success) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
      ...(result.error !== undefined && { error: result.error })
    });
  }
  return res.json({
    success: true,
    locations: result.locations,
    pagination: result.pagination
  });
};

// Get a single location by ID or slug with children and linked entities
exports.getLocation = async (req, res) => {
  const result = await locationService.getLocation(req.params.id);
  if (!result.success) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
      ...(result.error !== undefined && { error: result.error })
    });
  }
  return res.json({
    success: true,
    location: result.location,
    stats: result.stats
  });
};

// Update a location (admin/moderator only)
exports.updateLocation = async (req, res) => {
  const result = await locationService.updateLocation(
    req.params.id,
    req.body,
    req.user?.role,
    req.user?.id || null
  );
  if (!result.success) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
      ...(result.error !== undefined && { error: result.error })
    });
  }
  return res.json({
    success: true,
    message: 'Location updated successfully',
    location: result.location
  });
};

// Delete a location (admin/moderator only)
exports.deleteLocation = async (req, res) => {
  const result = await locationService.deleteLocation(
    req.params.id,
    req.user?.role,
    req.user?.id || null
  );
  if (!result.success) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
      ...(result.error !== undefined && { error: result.error })
    });
  }
  return res.json({ success: true, message: 'Location deleted successfully' });
};

// Link a location to an entity (article or user)
exports.linkLocation = async (req, res) => {
  const result = await locationService.linkLocation(req.body, toUserObj(req.user));
  if (!result.success) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
      ...(result.error !== undefined && { error: result.error })
    });
  }
  return res.status(201).json({
    success: true,
    message: 'Location linked successfully',
    link: result.link
  });
};

// Unlink a location from an entity
exports.unlinkLocation = async (req, res) => {
  const result = await locationService.unlinkLocation(req.body, toUserObj(req.user));
  if (!result.success) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
      ...(result.error !== undefined && { error: result.error })
    });
  }
  return res.json({ success: true, message: 'Location unlinked successfully' });
};

// Get all locations linked to an entity
exports.getEntityLocations = async (req, res) => {
  const { entity_type, entity_id } = req.params;
  const result = await locationService.getEntityLocations(entity_type, entity_id);
  if (!result.success) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
      ...(result.error !== undefined && { error: result.error })
    });
  }
  return res.json({ success: true, locations: result.locations });
};

// Get all entities (articles/users/polls) linked to a location
exports.getLocationEntities = async (req, res) => {
  const result = await locationService.getLocationEntities(req.params.id, req.query, toUserObj(req.user));
  if (!result.success) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
      ...(result.error !== undefined && { error: result.error })
    });
  }
  return res.json({
    success: true,
    articles: result.articles,
    users: result.users,
    usersCount: result.usersCount,
    unclaimed: result.unclaimed,
    unclaimedCount: result.unclaimedCount,
    polls: result.polls
  });
};

// Create a new country request (any authenticated user)
exports.createLocationRequest = async (req, res) => {
  const result = await locationService.createLocationRequest(req.body, req.user ? req.user.id : null);
  if (!result.success) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
      ...(result.error !== undefined && { error: result.error })
    });
  }
  return res.status(201).json({
    success: true,
    message: 'Country request submitted successfully',
    request: result.request
  });
};

// List location requests (admin/moderator only)
exports.getLocationRequests = async (req, res) => {
  const result = await locationService.getLocationRequests(req.query);
  if (!result.success) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
      ...(result.error !== undefined && { error: result.error })
    });
  }
  return res.json({
    success: true,
    requests: result.requests,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages
  });
};

// Update location request status (admin/moderator only)
exports.updateLocationRequest = async (req, res) => {
  const result = await locationService.updateLocationRequest(req.params.id, req.body, req.user.id);
  if (!result.success) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
      ...(result.error !== undefined && { error: result.error })
    });
  }
  return res.json({
    success: true,
    message: 'Location request updated successfully',
    request: result.request
  });
};

// Upload and replace image for a location (admin/moderator only)
exports.uploadLocationImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const locationId = parseInt(req.params.id, 10);
    if (!locationId) {
      return res.status(400).json({ success: false, message: 'Invalid location ID.' });
    }
    const location = await Location.findByPk(locationId);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found.' });
    }
    const { processLocationImage } = require('../services/imageProcessingService');
    const { saveLocationImage } = require('../services/imageStorageService');
    let optimizedBuffer;
    try {
      optimizedBuffer = await processLocationImage(req.file.buffer);
    } catch (err) {
      console.error('Location image processing failed:', err);
      const isHeic = /^image\/hei[cf](-sequence)?$/.test(req.file.mimetype || '');
      if (isHeic) {
        return res.status(422).json({
          success: false,
          message: 'HEIC/HEIF images could not be processed on this server. Please convert to JPEG, PNG, or WebP and try again.',
        });
      }
      return res.status(422).json({ success: false, message: 'Invalid or corrupt image.' });
    }
    const imageUrl = saveLocationImage(optimizedBuffer, locationId);
    location.imageUrl = imageUrl;
    location.imageUpdatedAt = new Date();
    location.imageUpdatedBy = req.user.id;
    await location.save();
    return res.status(200).json({
      success: true,
      message: 'Location image uploaded successfully.',
      data: { imageUrl, imageUpdatedAt: location.imageUpdatedAt }
    });
  } catch (error) {
    console.error('Upload location image error:', error);
    return res.status(500).json({ success: false, message: 'Error uploading location image.' });
  }
};
