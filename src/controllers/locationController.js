const locationService = require('../services/locationService');

// Create a new location (admin/moderator only)
exports.createLocation = async (req, res) => {
  try {
    const result = await locationService.createLocation(req.body);
    if (result.error) {
      return res.status(result.status).json({ success: false, message: result.error });
    }
    res.status(201).json({ success: true, message: 'Location created successfully', location: result.location });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all locations with optional filtering
exports.getLocations = async (req, res) => {
  try {
    const result = await locationService.getLocations(req.query);
    res.json({
      success: true,
      locations: result.locations,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get a single location by ID or slug with children and linked entities
exports.getLocation = async (req, res) => {
  try {
    const result = await locationService.getLocation(req.params.id);
    if (result.error) {
      return res.status(result.status).json({ success: false, message: result.error });
    }
    res.json({ success: true, location: result.location, stats: result.stats });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update a location (admin/moderator only)
exports.updateLocation = async (req, res) => {
  try {
    const result = await locationService.updateLocation(req.params.id, req.body);
    if (result.error) {
      return res.status(result.status).json({ success: false, message: result.error });
    }
    res.json({ success: true, message: 'Location updated successfully', location: result.location });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete a location (admin/moderator only)
exports.deleteLocation = async (req, res) => {
  try {
    const result = await locationService.deleteLocation(req.params.id);
    if (result.error) {
      return res.status(result.status).json({ success: false, message: result.error });
    }
    res.json({ success: true, message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Link a location to an entity (article or user)
exports.linkLocation = async (req, res) => {
  try {
    const result = await locationService.linkLocation(req.body, req.user);
    if (result.error) {
      return res.status(result.status).json({ success: false, message: result.error });
    }
    res.status(201).json({ success: true, message: 'Location linked successfully', link: result.link });
  } catch (error) {
    console.error('Error linking location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Unlink a location from an entity
exports.unlinkLocation = async (req, res) => {
  try {
    const result = await locationService.unlinkLocation(req.body, req.user);
    if (result.error) {
      return res.status(result.status).json({ success: false, message: result.error });
    }
    res.json({ success: true, message: 'Location unlinked successfully' });
  } catch (error) {
    console.error('Error unlinking location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlink location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all locations linked to an entity
exports.getEntityLocations = async (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;
    const result = await locationService.getEntityLocations(entity_type, entity_id);
    if (result.error) {
      return res.status(result.status).json({ success: false, message: result.error });
    }
    res.json({ success: true, locations: result.locations });
  } catch (error) {
    console.error('Error fetching entity locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch entity locations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all entities (articles/users/polls) linked to a location
exports.getLocationEntities = async (req, res) => {
  try {
    const { id } = req.params;
    const { entity_type } = req.query;
    const result = await locationService.getLocationEntities(id, entity_type, req.user);
    res.json({
      success: true,
      articles: result.articles,
      users: result.users,
      usersCount: result.usersCount,
      polls: result.polls
    });
  } catch (error) {
    console.error('Error fetching location entities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location entities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create a new country request (any authenticated user)
exports.createLocationRequest = async (req, res) => {
  try {
    const result = await locationService.createLocationRequest(req.body, req.user ? req.user.id : null);
    if (result.error) {
      return res.status(result.status).json({ success: false, message: result.error });
    }
    res.status(201).json({ success: true, message: 'Country request submitted successfully', request: result.request });
  } catch (error) {
    console.error('Error creating location request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit country request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// List location requests (admin/moderator only)
exports.getLocationRequests = async (req, res) => {
  try {
    const result = await locationService.getLocationRequests(req.query);
    res.json({
      success: true,
      requests: result.requests,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    });
  } catch (error) {
    console.error('Error fetching location requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location requests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update location request status (admin/moderator only)
exports.updateLocationRequest = async (req, res) => {
  try {
    const result = await locationService.updateLocationRequest(req.params.id, req.body, req.user.id);
    if (result.error) {
      return res.status(result.status).json({ success: false, message: result.error });
    }
    res.json({ success: true, message: 'Location request updated successfully', request: result.request });
  } catch (error) {
    console.error('Error updating location request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
