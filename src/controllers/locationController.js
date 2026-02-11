const { Location, LocationLink, Article, User, Poll } = require('../models');
const { Op } = require('sequelize');
const { fetchWikipediaData } = require('../utils/wikipediaFetcher');

// Helper function to generate slug from name
const generateSlug = (name, type) => {
  return `${type}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
};

// Helper function to validate Wikipedia URL
const isValidWikipediaUrl = (url) => {
  if (!url) return true; // Allow empty/null values
  try {
    const parsedUrl = new URL(url);
    // Check if the hostname is a Wikipedia domain
    return parsedUrl.hostname.endsWith('.wikipedia.org');
  } catch (error) {
    return false;
  }
};

// Helper to collect all descendant location IDs for a location.
const getDescendantLocationIds = async (rootId) => {
  const descendantIds = [];
  let queue = [rootId];

  while (queue.length > 0) {
    const children = await Location.findAll({
      where: { parent_id: { [Op.in]: queue } },
      attributes: ['id']
    });

    const childIds = children.map((child) => child.id);
    if (childIds.length === 0) {
      break;
    }

    descendantIds.push(...childIds);
    queue = childIds;
  }

  return descendantIds;
};

// Create a new location (admin/moderator only)
exports.createLocation = async (req, res) => {
  try {
    const { name, name_local, type, parent_id, code, lat, lng, bounding_box, wikipedia_url } = req.body;

    // Validation
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required'
      });
    }

    const validTypes = ['international', 'country', 'prefecture', 'municipality'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location type'
      });
    }

    // Validate Wikipedia URL if provided
    if (wikipedia_url && !isValidWikipediaUrl(wikipedia_url)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Wikipedia URL. Must be a valid Wikipedia domain URL (e.g., https://en.wikipedia.org/wiki/...)'
      });
    }

    // Generate slug
    const baseSlug = generateSlug(name, type);
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (await Location.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Check for duplicate based on name, type, and parent
    const existing = await Location.findOne({
      where: {
        name,
        type,
        parent_id: parent_id || null
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Location with this name already exists at this level'
      });
    }

    // If parent_id provided, verify it exists
    if (parent_id) {
      const parent = await Location.findByPk(parent_id);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent location not found'
        });
      }
    }

    // Fetch Wikipedia data if URL is provided
    let wikipedia_image_url = null;
    let population = null;
    let wikipedia_data_updated_at = null;

    if (wikipedia_url) {
      const wikiData = await fetchWikipediaData(wikipedia_url);
      wikipedia_image_url = wikiData.image_url;
      population = wikiData.population;
      wikipedia_data_updated_at = new Date();
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
      bounding_box,
      wikipedia_url,
      wikipedia_image_url,
      population,
      wikipedia_data_updated_at
    });

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      location
    });
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
    const { type, parent_id, search, limit = 100, offset = 0 } = req.query;

    const where = {};
    
    if (type) {
      where.type = type;
    }

    if (parent_id !== undefined) {
      where.parent_id = parent_id === 'null' || parent_id === '' ? null : parent_id;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { name_local: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const locations = await Location.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']],
      include: [
        {
          model: Location,
          as: 'parent',
          attributes: ['id', 'name', 'type']
        }
      ]
    });

    const total = await Location.count({ where });

    res.json({
      success: true,
      locations,
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get a single location by ID with children and linked entities
exports.getLocation = async (req, res) => {
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

    // Get counts of linked entities
    const articleCount = await LocationLink.count({
      where: {
        location_id: id,
        entity_type: 'article'
      }
    });

    const userCount = await LocationLink.count({
      where: {
        location_id: id,
        entity_type: 'user'
      }
    });

    const pollCount = await LocationLink.count({
      where: {
        location_id: id,
        entity_type: 'poll'
      }
    });

    res.json({
      success: true,
      location,
      stats: {
        articleCount,
        userCount,
        pollCount,
        childrenCount: location.children?.length || 0
      }
    });
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
    const { id } = req.params;
    const { name, name_local, type, parent_id, code, lat, lng, bounding_box, wikipedia_url } = req.body;

    const location = await Location.findByPk(id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Validate Wikipedia URL if provided
    if (wikipedia_url !== undefined && wikipedia_url !== null && wikipedia_url !== '' && !isValidWikipediaUrl(wikipedia_url)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Wikipedia URL. Must be a valid Wikipedia domain URL (e.g., https://en.wikipedia.org/wiki/...)'
      });
    }

    // If changing name or type, regenerate slug
    let slug = location.slug;
    if ((name && name !== location.name) || (type && type !== location.type)) {
      const newName = name || location.name;
      const newType = type || location.type;
      const baseSlug = generateSlug(newName, newType);
      slug = baseSlug;
      let counter = 1;

      // Ensure slug is unique (excluding current location)
      while (await Location.findOne({ where: { slug, id: { [Op.ne]: id } } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Check for duplicate if name, type, or parent changed
    if (name || type || parent_id !== undefined) {
      const existing = await Location.findOne({
        where: {
          name: name || location.name,
          type: type || location.type,
          parent_id: parent_id !== undefined ? (parent_id || null) : location.parent_id,
          id: { [Op.ne]: id }
        }
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Location with this name already exists at this level'
        });
      }
    }

    // Handle Wikipedia data updates
    let updateData = {
      name: name || location.name,
      name_local: name_local !== undefined ? name_local : location.name_local,
      type: type || location.type,
      parent_id: parent_id !== undefined ? (parent_id || null) : location.parent_id,
      code: code !== undefined ? code : location.code,
      slug,
      lat: lat !== undefined ? lat : location.lat,
      lng: lng !== undefined ? lng : location.lng,
      bounding_box: bounding_box !== undefined ? bounding_box : location.bounding_box,
      wikipedia_url: wikipedia_url !== undefined ? wikipedia_url : location.wikipedia_url
    };

    // Detect if wikipedia_url has changed
    const wikipediaUrlChanged = wikipedia_url !== undefined && wikipedia_url !== location.wikipedia_url;

    if (wikipediaUrlChanged) {
      if (wikipedia_url && wikipedia_url.trim()) {
        // New URL provided - fetch Wikipedia data
        const wikiData = await fetchWikipediaData(wikipedia_url);
        updateData.wikipedia_image_url = wikiData.image_url;
        updateData.population = wikiData.population;
        updateData.wikipedia_data_updated_at = new Date();
      } else {
        // URL removed - clear Wikipedia cache fields
        updateData.wikipedia_image_url = null;
        updateData.population = null;
        updateData.wikipedia_data_updated_at = null;
      }
    } else if (wikipedia_url && wikipedia_url.trim() && !location.population) {
      // URL unchanged but population missing - refetch
      const wikiData = await fetchWikipediaData(wikipedia_url);
      updateData.wikipedia_image_url = wikiData.image_url;
      updateData.population = wikiData.population;
      updateData.wikipedia_data_updated_at = new Date();
    }

    await location.update(updateData);

    res.json({
      success: true,
      message: 'Location updated successfully',
      location
    });
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
    const { id } = req.params;

    const location = await Location.findByPk(id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Check if location has children
    const childrenCount = await Location.count({ where: { parent_id: id } });
    if (childrenCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete location with child locations'
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
      message: 'Failed to delete location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    if (!['article', 'user', 'poll'].includes(entity_type)) {
      return res.status(400).json({
        success: false,
        message: 'entity_type must be either "article", "user", or "poll"'
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
      // Check authorization - only author or admin/moderator can link
      if (article.authorId !== req.user.id && !['admin', 'moderator'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to link this article'
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
      // Check authorization - only the user themselves or admin can link
      if (user.id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to link this user'
        });
      }
    } else if (entity_type === 'poll') {
      const poll = await Poll.findByPk(entity_id);
      if (!poll) {
        return res.status(404).json({
          success: false,
          message: 'Poll not found'
        });
      }
      // Check authorization - only creator or admin/moderator can link
      if (poll.creatorId !== req.user.id && !['admin', 'moderator'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to link this poll'
        });
      }
    }

    // Check if link already exists
    const existingLink = await LocationLink.findOne({
      where: { location_id, entity_type, entity_id }
    });

    if (existingLink) {
      return res.status(409).json({
        success: false,
        message: 'Location link already exists'
      });
    }

    const link = await LocationLink.create({
      location_id,
      entity_type,
      entity_id
    });

    res.status(201).json({
      success: true,
      message: 'Location linked successfully',
      link
    });
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
    const { location_id, entity_type, entity_id } = req.body;

    // Validation
    if (!location_id || !entity_type || !entity_id) {
      return res.status(400).json({
        success: false,
        message: 'location_id, entity_type, and entity_id are required'
      });
    }

    // Authorization check
    if (entity_type === 'article') {
      const article = await Article.findByPk(entity_id);
      if (article && article.authorId !== req.user.id && !['admin', 'moderator'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to unlink this article'
        });
      }
    } else if (entity_type === 'user') {
      if (parseInt(entity_id) !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to unlink this user'
        });
      }
    } else if (entity_type === 'poll') {
      const poll = await Poll.findByPk(entity_id);
      if (poll && poll.creatorId !== req.user.id && !['admin', 'moderator'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to unlink this poll'
        });
      }
    }

    const link = await LocationLink.findOne({
      where: { location_id, entity_type, entity_id }
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Location link not found'
      });
    }

    await link.destroy();

    res.json({
      success: true,
      message: 'Location unlinked successfully'
    });
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

    if (!['article', 'user', 'poll'].includes(entity_type)) {
      return res.status(400).json({
        success: false,
        message: 'entity_type must be either "article", "user", or "poll"'
      });
    }

    const links = await LocationLink.findAll({
      where: { entity_type, entity_id },
      include: [
        {
          model: Location,
          as: 'location',
          include: [
            {
              model: Location,
              as: 'parent',
              attributes: ['id', 'name', 'type', 'slug']
            }
          ]
        }
      ]
    });

    const locations = links.map(link => link.location);

    res.json({
      success: true,
      locations
    });
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
    const isAuthenticated = !!req.user;
    const isAdmin = req.user?.role === 'admin';
    const { id } = req.params;
    const { entity_type } = req.query;

    const where = { location_id: id };
    if (entity_type && ['article', 'user', 'poll'].includes(entity_type)) {
      where.entity_type = entity_type;
    }

    const links = await LocationLink.findAll({
      where,
      attributes: ['id', 'entity_type', 'entity_id']
    });

    // Group entity IDs by type
    const articleIds = links.filter(l => l.entity_type === 'article').map(l => l.entity_id);
    const userIds = links.filter(l => l.entity_type === 'user').map(l => l.entity_id);
    const pollIds = links.filter(l => l.entity_type === 'poll').map(l => l.entity_id);

    // Include users linked to descendant locations
    let combinedUserIds = userIds;
    if (!entity_type || entity_type === 'user') {
      const descendantIds = await getDescendantLocationIds(id);
      if (descendantIds.length > 0) {
        const childUserLinks = await LocationLink.findAll({
          where: {
            entity_type: 'user',
            location_id: { [Op.in]: descendantIds }
          },
          attributes: ['entity_id']
        });

        const childUserIds = childUserLinks.map((link) => link.entity_id);
        combinedUserIds = Array.from(new Set([...combinedUserIds, ...childUserIds]));
      }
    }

    // Fetch all articles and users in batch queries
    const articles = articleIds.length > 0 ? await Article.findAll({
      where: { id: articleIds },
      attributes: ['id', 'title', 'summary', 'status', 'type', 'createdAt', 'authorId', 'hideAuthor'],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username']
        }
      ]
    }) : [];

    const usersCount = combinedUserIds.length;
    const users = isAuthenticated && usersCount > 0 ? await User.findAll({
      where: {
        id: combinedUserIds,
        searchable: true
      },
      attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'avatarColor']
    }) : [];

    const polls = pollIds.length > 0 ? await Poll.findAll({
      where: { id: pollIds },
      attributes: ['id', 'title', 'description', 'status', 'visibility', 'createdAt', 'creatorId', 'hideCreator'],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }
      ]
    }) : [];

    const articlesWithVisibility = articles.map((article) => {
      const data = article.toJSON();
      if (data.hideAuthor && (!req.user || (!isAdmin && req.user.id !== data.authorId))) {
        data.author = null;
      }
      return data;
    });

    const pollsWithVisibility = polls.map((poll) => {
      const data = poll.toJSON();
      if (data.hideCreator && (!req.user || (!isAdmin && req.user.id !== data.creatorId))) {
        data.creator = null;
      }
      return data;
    });

    res.json({
      success: true,
      articles: articlesWithVisibility,
      users,
      usersCount,
      polls: pollsWithVisibility
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
