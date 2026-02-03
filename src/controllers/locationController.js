const { Location, LocationLink, User, Article } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all locations with optional filtering
 * Query params: type, parent_id, search
 */
exports.getAllLocations = async (req, res) => {
  try {
    const { type, parent_id, search, limit = 100, offset = 0 } = req.query;
    
    const where = {};
    
    if (type) {
      where.type = type;
    }
    
    if (parent_id !== undefined) {
      where.parent_id = parent_id === 'null' ? null : parseInt(parent_id);
    }
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { name_local: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const locations = await Location.findAll({
      where,
      include: [
        {
          model: Location,
          as: 'parent',
          attributes: ['id', 'name', 'type']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['type', 'ASC'], ['name', 'ASC']]
    });
    
    const total = await Location.count({ where });
    
    res.json({
      success: true,
      data: locations,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations',
      error: error.message
    });
  }
};

/**
 * Get a single location by ID with linked entities
 */
exports.getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const location = await Location.findByPk(id, {
      include: [
        {
          model: Location,
          as: 'parent',
          attributes: ['id', 'name', 'type', 'slug']
        },
        {
          model: Location,
          as: 'children',
          attributes: ['id', 'name', 'type', 'slug']
        },
        {
          model: LocationLink,
          as: 'links',
          attributes: ['id', 'entity_type', 'entity_id']
        }
      ]
    });
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    // Get linked articles
    const articleLinks = await LocationLink.findAll({
      where: {
        location_id: id,
        entity_type: 'article'
      }
    });
    
    const articleIds = articleLinks.map(link => link.entity_id);
    const articles = articleIds.length > 0 ? await Article.findAll({
      where: { id: articleIds },
      attributes: ['id', 'title', 'summary', 'status', 'publishedAt'],
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }]
    }) : [];
    
    // Get linked users (residents)
    const userLinks = await LocationLink.findAll({
      where: {
        location_id: id,
        entity_type: 'user'
      }
    });
    
    const userIds = userLinks.map(link => link.entity_id);
    const users = userIds.length > 0 ? await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'username', 'firstName', 'lastName', 'avatar']
    }) : [];
    
    res.json({
      success: true,
      data: {
        ...location.toJSON(),
        linkedArticles: articles,
        linkedUsers: users
      }
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location',
      error: error.message
    });
  }
};

/**
 * Get child locations of a location
 */
exports.getChildLocations = async (req, res) => {
  try {
    const { id } = req.params;
    
    const children = await Location.findAll({
      where: { parent_id: id },
      order: [['name', 'ASC']]
    });
    
    res.json({
      success: true,
      data: children
    });
  } catch (error) {
    console.error('Error fetching child locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch child locations',
      error: error.message
    });
  }
};

/**
 * Create a new location (admin/moderator only)
 */
exports.createLocation = async (req, res) => {
  try {
    const { name, name_local, type, parent_id, code, slug, lat, lng, bounding_box } = req.body;
    
    // Validation
    if (!name || !type || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, and slug are required'
      });
    }
    
    const validTypes = ['international', 'country', 'prefecture', 'municipality'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location type'
      });
    }
    
    // Check for duplicate slug
    const existingSlug = await Location.findOne({ where: { slug } });
    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message: 'A location with this slug already exists'
      });
    }
    
    // Check for duplicate location (same type, name, and parent)
    const duplicate = await Location.findOne({
      where: {
        type,
        name,
        parent_id: parent_id || null
      }
    });
    
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'A location with this name already exists at this level'
      });
    }
    
    // Validate parent exists if parent_id is provided
    if (parent_id) {
      const parent = await Location.findByPk(parent_id);
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: 'Parent location not found'
        });
      }
    }
    
    const location = await Location.create({
      name,
      name_local,
      type,
      parent_id: parent_id || null,
      code,
      slug,
      lat,
      lng,
      bounding_box
    });
    
    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: location
    });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create location',
      error: error.message
    });
  }
};

/**
 * Update a location (admin/moderator only)
 */
exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, name_local, type, parent_id, code, slug, lat, lng, bounding_box } = req.body;
    
    const location = await Location.findByPk(id);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    // Validate type if provided
    if (type) {
      const validTypes = ['international', 'country', 'prefecture', 'municipality'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location type'
        });
      }
    }
    
    // Check for duplicate slug if slug is being changed
    if (slug && slug !== location.slug) {
      const existingSlug = await Location.findOne({ where: { slug } });
      if (existingSlug) {
        return res.status(400).json({
          success: false,
          message: 'A location with this slug already exists'
        });
      }
    }
    
    // Validate parent exists if parent_id is being changed
    if (parent_id !== undefined && parent_id !== location.parent_id) {
      if (parent_id) {
        const parent = await Location.findByPk(parent_id);
        if (!parent) {
          return res.status(400).json({
            success: false,
            message: 'Parent location not found'
          });
        }
        
        // Prevent circular references
        if (parent_id == id) {
          return res.status(400).json({
            success: false,
            message: 'A location cannot be its own parent'
          });
        }
      }
    }
    
    // Update fields
    if (name !== undefined) location.name = name;
    if (name_local !== undefined) location.name_local = name_local;
    if (type !== undefined) location.type = type;
    if (parent_id !== undefined) location.parent_id = parent_id || null;
    if (code !== undefined) location.code = code;
    if (slug !== undefined) location.slug = slug;
    if (lat !== undefined) location.lat = lat;
    if (lng !== undefined) location.lng = lng;
    if (bounding_box !== undefined) location.bounding_box = bounding_box;
    
    await location.save();
    
    res.json({
      success: true,
      message: 'Location updated successfully',
      data: location
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};

/**
 * Delete a location (admin/moderator only)
 */
exports.deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const location = await Location.findByPk(id);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    // Check if location has children
    const childCount = await Location.count({ where: { parent_id: id } });
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete location with child locations. Delete children first.'
      });
    }
    
    // Delete all location links
    await LocationLink.destroy({ where: { location_id: id } });
    
    // Update users who have this as home location
    await User.update(
      { home_location_id: null },
      { where: { home_location_id: id } }
    );
    
    await location.destroy();
    
    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete location',
      error: error.message
    });
  }
};

/**
 * Link an entity (article or user) to a location
 */
exports.linkEntity = async (req, res) => {
  try {
    const { location_id, entity_type, entity_id } = req.body;
    
    // Validation
    if (!location_id || !entity_type || !entity_id) {
      return res.status(400).json({
        success: false,
        message: 'location_id, entity_type, and entity_id are required'
      });
    }
    
    if (!['article', 'user'].includes(entity_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entity_type. Must be "article" or "user"'
      });
    }
    
    // Verify location exists
    const location = await Location.findByPk(location_id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    // Verify entity exists
    if (entity_type === 'article') {
      const article = await Article.findByPk(entity_id);
      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }
    } else if (entity_type === 'user') {
      const user = await User.findByPk(entity_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    }
    
    // Check if link already exists
    const existingLink = await LocationLink.findOne({
      where: { location_id, entity_type, entity_id }
    });
    
    if (existingLink) {
      return res.status(400).json({
        success: false,
        message: 'This link already exists'
      });
    }
    
    const link = await LocationLink.create({
      location_id,
      entity_type,
      entity_id
    });
    
    res.status(201).json({
      success: true,
      message: 'Entity linked to location successfully',
      data: link
    });
  } catch (error) {
    console.error('Error linking entity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link entity to location',
      error: error.message
    });
  }
};

/**
 * Unlink an entity from a location
 */
exports.unlinkEntity = async (req, res) => {
  try {
    const { location_id, entity_type, entity_id } = req.body;
    
    const link = await LocationLink.findOne({
      where: { location_id, entity_type, entity_id }
    });
    
    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }
    
    await link.destroy();
    
    res.json({
      success: true,
      message: 'Entity unlinked from location successfully'
    });
  } catch (error) {
    console.error('Error unlinking entity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlink entity from location',
      error: error.message
    });
  }
};
