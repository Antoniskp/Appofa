const { Location, LocationLink, Article, User } = require('../models');
const { Op } = require('sequelize');

// Helper function to generate slug from name
const generateSlug = (name, parentId = null) => {
  let slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  if (parentId) {
    slug = `${slug}-${parentId}`;
  }
  
  return slug;
};

// Get all locations with optional filtering and hierarchy
exports.getAllLocations = async (req, res) => {
  try {
    const { type, parent_id, search, include_children } = req.query;
    
    const where = {};
    if (type) where.type = type;
    if (parent_id !== undefined) {
      where.parent_id = parent_id === 'null' ? null : parent_id;
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { name_local: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const includeOptions = [
      {
        model: Location,
        as: 'parent',
        attributes: ['id', 'name', 'type']
      }
    ];

    if (include_children === 'true') {
      includeOptions.push({
        model: Location,
        as: 'children',
        attributes: ['id', 'name', 'name_local', 'type', 'slug']
      });
    }

    const locations = await Location.findAll({
      where,
      include: includeOptions,
      order: [['type', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching locations',
      error: error.message
    });
  }
};

// Get location by ID or slug with linked entities
exports.getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const { include_links } = req.query;
    
    const where = isNaN(id) ? { slug: id } : { id };

    const includeOptions = [
      {
        model: Location,
        as: 'parent',
        attributes: ['id', 'name', 'name_local', 'type', 'slug']
      },
      {
        model: Location,
        as: 'children',
        attributes: ['id', 'name', 'name_local', 'type', 'slug', 'lat', 'lng']
      }
    ];

    if (include_links === 'true') {
      includeOptions.push({
        model: LocationLink,
        as: 'links',
        attributes: ['entity_type', 'entity_id']
      });
    }

    const location = await Location.findOne({
      where,
      include: includeOptions
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Optionally fetch linked articles and users
    let linkedData = {};
    if (include_links === 'true') {
      const articleIds = location.links
        .filter(link => link.entity_type === 'article')
        .map(link => link.entity_id);
      
      const userIds = location.links
        .filter(link => link.entity_type === 'user')
        .map(link => link.entity_id);

      if (articleIds.length > 0) {
        linkedData.articles = await Article.findAll({
          where: { id: articleIds },
          attributes: ['id', 'title', 'summary', 'status', 'publishedAt'],
          include: [{
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'firstName', 'lastName']
          }]
        });
      }

      if (userIds.length > 0) {
        linkedData.users = await User.findAll({
          where: { id: userIds },
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar']
        });
      }
    }

    res.json({
      success: true,
      data: {
        ...location.toJSON(),
        linkedData
      }
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching location',
      error: error.message
    });
  }
};

// Create a new location (admin/moderator only)
exports.createLocation = async (req, res) => {
  try {
    const { name, name_local, type, parent_id, code, lat, lng, bounding_box } = req.body;

    // Validation
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required'
      });
    }

    // Validate type
    const validTypes = ['international', 'country', 'prefecture', 'municipality'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location type'
      });
    }

    // Validate parent exists if parent_id provided
    if (parent_id) {
      const parent = await Location.findByPk(parent_id);
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: 'Parent location not found'
        });
      }
    }

    // Generate slug
    const slug = generateSlug(name, parent_id);

    // Check if slug already exists
    const existingSlug = await Location.findOne({ where: { slug } });
    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message: 'A location with similar name already exists'
      });
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

    // Fetch created location with parent info
    const createdLocation = await Location.findByPk(location.id, {
      include: [{
        model: Location,
        as: 'parent',
        attributes: ['id', 'name', 'type']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: createdLocation
    });
  } catch (error) {
    console.error('Error creating location:', error);
    
    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Location already exists with this name and parent'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating location',
      error: error.message
    });
  }
};

// Update a location (admin/moderator only)
exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, name_local, type, parent_id, code, lat, lng, bounding_box } = req.body;

    const location = await Location.findByPk(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Validate parent if changing
    if (parent_id !== undefined && parent_id !== location.parent_id) {
      if (parent_id !== null) {
        const parent = await Location.findByPk(parent_id);
        if (!parent) {
          return res.status(400).json({
            success: false,
            message: 'Parent location not found'
          });
        }

        // Prevent circular references
        if (parent_id === location.id) {
          return res.status(400).json({
            success: false,
            message: 'Location cannot be its own parent'
          });
        }
      }
    }

    // Update fields
    const updates = {};
    if (name !== undefined) {
      updates.name = name;
      updates.slug = generateSlug(name, parent_id || location.parent_id);
    }
    if (name_local !== undefined) updates.name_local = name_local;
    if (type !== undefined) updates.type = type;
    if (parent_id !== undefined) updates.parent_id = parent_id;
    if (code !== undefined) updates.code = code;
    if (lat !== undefined) updates.lat = lat;
    if (lng !== undefined) updates.lng = lng;
    if (bounding_box !== undefined) updates.bounding_box = bounding_box;

    await location.update(updates);

    // Fetch updated location with parent
    const updatedLocation = await Location.findByPk(location.id, {
      include: [{
        model: Location,
        as: 'parent',
        attributes: ['id', 'name', 'type']
      }]
    });

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: updatedLocation
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
};

// Delete a location (admin/moderator only)
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

    // Check if location has links
    const linkCount = await LocationLink.count({ where: { location_id: id } });
    if (linkCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete location that is linked to articles or users. Remove links first.'
      });
    }

    await location.destroy();

    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting location',
      error: error.message
    });
  }
};

// Link a location to an entity (article or user)
exports.linkLocation = async (req, res) => {
  try {
    const { location_id, entity_type, entity_id } = req.body;

    // Validation
    if (!location_id || !entity_type || !entity_id) {
      return res.status(400).json({
        success: false,
        message: 'location_id, entity_type, and entity_id are required'
      });
    }

    // Validate entity_type
    if (!['article', 'user'].includes(entity_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entity_type. Must be "article" or "user"'
      });
    }

    // Check if location exists
    const location = await Location.findByPk(location_id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Check if entity exists
    const Model = entity_type === 'article' ? Article : User;
    const entity = await Model.findByPk(entity_id);
    if (!entity) {
      return res.status(404).json({
        success: false,
        message: `${entity_type} not found`
      });
    }

    // For articles, check ownership or role
    if (entity_type === 'article') {
      const isOwner = entity.authorId === req.user.id;
      const canEdit = ['admin', 'editor'].includes(req.user.role);
      
      if (!isOwner && !canEdit) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to link location to this article'
        });
      }
    }

    // For users, check if linking to own profile or is admin
    if (entity_type === 'user') {
      const isSelf = entity_id === req.user.id;
      const isAdmin = req.user.role === 'admin';
      
      if (!isSelf && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to link location to this user'
        });
      }
    }

    // Create or update link
    const [link, created] = await LocationLink.findOrCreate({
      where: { location_id, entity_type, entity_id },
      defaults: { location_id, entity_type, entity_id }
    });

    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Location linked successfully' : 'Location link already exists',
      data: link
    });
  } catch (error) {
    console.error('Error linking location:', error);
    res.status(500).json({
      success: false,
      message: 'Error linking location',
      error: error.message
    });
  }
};

// Unlink a location from an entity
exports.unlinkLocation = async (req, res) => {
  try {
    const { location_id, entity_type, entity_id } = req.body;

    // Validation
    if (!location_id || !entity_type || !entity_id) {
      return res.status(400).json({
        success: false,
        message: 'location_id, entity_type, and entity_id are required'
      });
    }

    // For articles, check ownership or role
    if (entity_type === 'article') {
      const article = await Article.findByPk(entity_id);
      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }
      
      const isOwner = article.authorId === req.user.id;
      const canEdit = ['admin', 'editor'].includes(req.user.role);
      
      if (!isOwner && !canEdit) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to unlink location from this article'
        });
      }
    }

    // For users, check if unlinking from own profile or is admin
    if (entity_type === 'user') {
      const isSelf = entity_id === req.user.id;
      const isAdmin = req.user.role === 'admin';
      
      if (!isSelf && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to unlink location from this user'
        });
      }
    }

    const deleted = await LocationLink.destroy({
      where: { location_id, entity_type, entity_id }
    });

    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        message: 'Location link not found'
      });
    }

    res.json({
      success: true,
      message: 'Location unlinked successfully'
    });
  } catch (error) {
    console.error('Error unlinking location:', error);
    res.status(500).json({
      success: false,
      message: 'Error unlinking location',
      error: error.message
    });
  }
};

// Get locations linked to an entity
exports.getLinkedLocations = async (req, res) => {
  try {
    const { entity_type, entity_id } = req.query;

    if (!entity_type || !entity_id) {
      return res.status(400).json({
        success: false,
        message: 'entity_type and entity_id are required'
      });
    }

    const links = await LocationLink.findAll({
      where: { entity_type, entity_id },
      include: [{
        model: Location,
        as: 'location',
        include: [{
          model: Location,
          as: 'parent',
          attributes: ['id', 'name', 'type']
        }]
      }]
    });

    res.json({
      success: true,
      count: links.length,
      data: links.map(link => link.location)
    });
  } catch (error) {
    console.error('Error fetching linked locations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching linked locations',
      error: error.message
    });
  }
};
