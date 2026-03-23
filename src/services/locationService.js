const { Location, LocationLink, Article, User, Poll, LocationRequest } = require('../models');
const { Op, fn, col, where } = require('sequelize');
const { fetchWikipediaData } = require('../utils/wikipediaFetcher');
const { getDescendantLocationIds } = require('../utils/locationUtils');

const generateSlug = (name, type) => {
  return `${type}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
};

const isValidWikipediaUrl = (url) => {
  if (!url) return true;
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.endsWith('.wikipedia.org');
  } catch (error) {
    return false;
  }
};

/**
 * Create a new location.
 * Returns { error, status } on failure or { location } on success.
 */
const createLocation = async (locationData) => {
  const { name, name_local, type, parent_id, code, lat, lng, bounding_box, wikipedia_url } = locationData;
  const normalizedName = typeof name === 'string' ? name.trim() : '';

  if (!normalizedName || !type) {
    return { error: 'Name and type are required', status: 400 };
  }

  const validTypes = ['international', 'country', 'prefecture', 'municipality'];
  if (!validTypes.includes(type)) {
    return { error: 'Invalid location type', status: 400 };
  }

  if (wikipedia_url && !isValidWikipediaUrl(wikipedia_url)) {
    return {
      error: 'Invalid Wikipedia URL. Must be a valid Wikipedia domain URL (e.g., https://en.wikipedia.org/wiki/...)',
      status: 400
    };
  }

  const baseSlug = generateSlug(normalizedName, type);
  let slug = baseSlug;
  let counter = 1;

  while (await Location.findOne({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const existing = await Location.findOne({
    where: {
      type,
      parent_id: parent_id || null,
      [Op.and]: [
        where(fn('LOWER', fn('TRIM', col('name'))), normalizedName.toLowerCase())
      ]
    }
  });

  if (existing) {
    return { error: 'Location with this name already exists at this level', status: 409 };
  }

  if (parent_id) {
    const parent = await Location.findByPk(parent_id);
    if (!parent) {
      return { error: 'Parent location not found', status: 404 };
    }
  }

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
    name: normalizedName,
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

  return { location };
};

/**
 * Get all locations with optional filtering and moderator info.
 * Returns { locations, pagination }.
 */
const getLocations = async (query) => {
  const { type, parent_id, search, limit = 100, offset = 0 } = query;

  const whereClause = {};

  if (type) {
    whereClause.type = type;
  }

  if (parent_id !== undefined) {
    whereClause.parent_id = parent_id === 'null' || parent_id === '' ? null : parent_id;
  }

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { name_local: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const locations = await Location.findAll({
    where: whereClause,
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

  const locationIds = locations.map((location) => location.id);
  const moderatorLocationIds = new Set();
  const moderatorPreviewByLocationId = new Map();

  if (locationIds.length > 0) {
    const moderatorAssignments = await User.findAll({
      where: {
        role: 'moderator',
        homeLocationId: { [Op.in]: locationIds }
      },
      attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'avatarColor', 'homeLocationId'],
      order: [['createdAt', 'ASC'], ['id', 'ASC']],
      raw: true
    });

    moderatorAssignments.forEach((assignment) => {
      const homeLocationId = Number(assignment.homeLocationId);
      if (Number.isInteger(homeLocationId)) {
        moderatorLocationIds.add(homeLocationId);

        if (!moderatorPreviewByLocationId.has(homeLocationId)) {
          moderatorPreviewByLocationId.set(homeLocationId, {
            id: assignment.id,
            username: assignment.username,
            firstName: assignment.firstName,
            lastName: assignment.lastName,
            avatar: assignment.avatar,
            avatarColor: assignment.avatarColor
          });
        }
      }
    });
  }

  const locationsWithModeratorStatus = locations.map((location) => {
    const serializedLocation = location.toJSON();
    return {
      ...serializedLocation,
      hasModerator: moderatorLocationIds.has(Number(location.id)),
      moderatorPreview: moderatorPreviewByLocationId.get(Number(location.id)) || null
    };
  });

  const total = await Location.count({ where: whereClause });

  return {
    locations: locationsWithModeratorStatus,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  };
};

/**
 * Get a single location by ID or slug with children and linked entity counts.
 * Returns { error, status } on failure or { location, stats } on success.
 */
const getLocation = async (id) => {
  const isNumericId = /^\d+$/.test(id);
  const findOptions = {
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
  };

  const location = isNumericId
    ? await Location.findByPk(id, findOptions)
    : await Location.findOne({ where: { slug: id }, ...findOptions });

  if (!location) {
    return { error: 'Location not found', status: 404 };
  }

  const locationId = location.id;
  const articleCount = await LocationLink.count({
    where: { location_id: locationId, entity_type: 'article' }
  });
  const userCount = await LocationLink.count({
    where: { location_id: locationId, entity_type: 'user' }
  });
  const pollCount = await LocationLink.count({
    where: { location_id: locationId, entity_type: 'poll' }
  });

  const moderator = await User.findOne({
    where: { role: 'moderator', homeLocationId: locationId },
    attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'avatarColor'],
    order: [['createdAt', 'ASC'], ['id', 'ASC']]
  });

  const locationData = location.toJSON();
  locationData.hasModerator = !!moderator;
  locationData.moderatorPreview = moderator ? moderator.toJSON() : null;

  return {
    location: locationData,
    stats: {
      articleCount,
      userCount,
      pollCount,
      childrenCount: location.children?.length || 0
    }
  };
};

/**
 * Update a location.
 * Returns { error, status } on failure or { location } on success.
 */
const updateLocation = async (id, updateData) => {
  const { name, name_local, type, parent_id, code, lat, lng, bounding_box, wikipedia_url } = updateData;

  const location = await Location.findByPk(id);

  if (!location) {
    return { error: 'Location not found', status: 404 };
  }

  if (wikipedia_url !== undefined && wikipedia_url !== null && wikipedia_url !== '' && !isValidWikipediaUrl(wikipedia_url)) {
    return {
      error: 'Invalid Wikipedia URL. Must be a valid Wikipedia domain URL (e.g., https://en.wikipedia.org/wiki/...)',
      status: 400
    };
  }

  let slug = location.slug;
  if ((name && name !== location.name) || (type && type !== location.type)) {
    const newName = name || location.name;
    const newType = type || location.type;
    const baseSlug = generateSlug(newName, newType);
    slug = baseSlug;
    let counter = 1;

    while (await Location.findOne({ where: { slug, id: { [Op.ne]: id } } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

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
      return { error: 'Location with this name already exists at this level', status: 409 };
    }
  }

  let locationUpdateData = {
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

  const wikipediaUrlChanged = wikipedia_url !== undefined && wikipedia_url !== location.wikipedia_url;

  if (wikipediaUrlChanged) {
    if (wikipedia_url && wikipedia_url.trim()) {
      const wikiData = await fetchWikipediaData(wikipedia_url);
      locationUpdateData.wikipedia_image_url = wikiData.image_url;
      locationUpdateData.population = wikiData.population;
      locationUpdateData.wikipedia_data_updated_at = new Date();
    } else {
      locationUpdateData.wikipedia_image_url = null;
      locationUpdateData.population = null;
      locationUpdateData.wikipedia_data_updated_at = null;
    }
  } else if (wikipedia_url && wikipedia_url.trim() && !location.population) {
    const wikiData = await fetchWikipediaData(wikipedia_url);
    locationUpdateData.wikipedia_image_url = wikiData.image_url;
    locationUpdateData.population = wikiData.population;
    locationUpdateData.wikipedia_data_updated_at = new Date();
  }

  await location.update(locationUpdateData);

  return { location };
};

/**
 * Delete a location.
 * Returns { error, status } on failure or { success: true } on success.
 */
const deleteLocation = async (id) => {
  const location = await Location.findByPk(id);

  if (!location) {
    return { error: 'Location not found', status: 404 };
  }

  const childrenCount = await Location.count({ where: { parent_id: id } });
  if (childrenCount > 0) {
    return { error: 'Cannot delete location with child locations', status: 400 };
  }

  await location.destroy();
  return { success: true };
};

/**
 * Link a location to an entity.
 * Returns { error, status } on failure or { link } on success.
 */
const linkLocation = async (linkData, user) => {
  const { location_id, entity_type, entity_id } = linkData;

  if (!location_id || !entity_type || !entity_id) {
    return { error: 'location_id, entity_type, and entity_id are required', status: 400 };
  }

  if (!['article', 'user', 'poll'].includes(entity_type)) {
    return { error: 'entity_type must be either "article", "user", or "poll"', status: 400 };
  }

  const location = await Location.findByPk(location_id);
  if (!location) {
    return { error: 'Location not found', status: 404 };
  }

  if (entity_type === 'article') {
    const article = await Article.findByPk(entity_id);
    if (!article) {
      return { error: 'Article not found', status: 404 };
    }
    if (article.authorId !== user.id && !['admin', 'moderator'].includes(user.role)) {
      return { error: 'Not authorized to link this article', status: 403 };
    }
  } else if (entity_type === 'user') {
    const linkedUser = await User.findByPk(entity_id);
    if (!linkedUser) {
      return { error: 'User not found', status: 404 };
    }
    if (linkedUser.id !== user.id && user.role !== 'admin') {
      return { error: 'Not authorized to link this user', status: 403 };
    }
  } else if (entity_type === 'poll') {
    const poll = await Poll.findByPk(entity_id);
    if (!poll) {
      return { error: 'Poll not found', status: 404 };
    }
    if (poll.creatorId !== user.id && !['admin', 'moderator'].includes(user.role)) {
      return { error: 'Not authorized to link this poll', status: 403 };
    }
  }

  const existingLink = await LocationLink.findOne({
    where: { location_id, entity_type, entity_id }
  });

  if (existingLink) {
    return { error: 'Location link already exists', status: 409 };
  }

  const link = await LocationLink.create({ location_id, entity_type, entity_id });
  return { link };
};

/**
 * Unlink a location from an entity.
 * Returns { error, status } on failure or { success: true } on success.
 */
const unlinkLocation = async (unlinkData, user) => {
  const { location_id, entity_type, entity_id } = unlinkData;

  if (!location_id || !entity_type || !entity_id) {
    return { error: 'location_id, entity_type, and entity_id are required', status: 400 };
  }

  if (entity_type === 'article') {
    const article = await Article.findByPk(entity_id);
    if (article && article.authorId !== user.id && !['admin', 'moderator'].includes(user.role)) {
      return { error: 'Not authorized to unlink this article', status: 403 };
    }
  } else if (entity_type === 'user') {
    if (parseInt(entity_id) !== user.id && user.role !== 'admin') {
      return { error: 'Not authorized to unlink this user', status: 403 };
    }
  } else if (entity_type === 'poll') {
    const poll = await Poll.findByPk(entity_id);
    if (poll && poll.creatorId !== user.id && !['admin', 'moderator'].includes(user.role)) {
      return { error: 'Not authorized to unlink this poll', status: 403 };
    }
  }

  const link = await LocationLink.findOne({
    where: { location_id, entity_type, entity_id }
  });

  if (!link) {
    return { error: 'Location link not found', status: 404 };
  }

  await link.destroy();
  return { success: true };
};

/**
 * Get all locations linked to an entity.
 * Returns { error, status } on failure or { locations } on success.
 */
const getEntityLocations = async (entity_type, entity_id) => {
  if (!['article', 'user', 'poll'].includes(entity_type)) {
    return { error: 'entity_type must be either "article", "user", or "poll"', status: 400 };
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
  return { locations };
};

/**
 * Get all entities (articles/users/polls) linked to a location.
 * Returns { articles, users, usersCount, polls }.
 */
const getLocationEntities = async (id, entity_type, user) => {
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const linkWhere = { location_id: id };
  if (entity_type && ['article', 'user', 'poll'].includes(entity_type)) {
    linkWhere.entity_type = entity_type;
  }

  const links = await LocationLink.findAll({
    where: linkWhere,
    attributes: ['id', 'entity_type', 'entity_id']
  });

  const articleIds = links.filter(l => l.entity_type === 'article').map(l => l.entity_id);
  const userIds = links.filter(l => l.entity_type === 'user').map(l => l.entity_id);
  const pollIds = links.filter(l => l.entity_type === 'poll').map(l => l.entity_id);

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
    if (data.hideAuthor && (!user || (!isAdmin && user.id !== data.authorId))) {
      data.author = null;
    }
    return data;
  });

  const pollsWithVisibility = polls.map((poll) => {
    const data = poll.toJSON();
    if (data.hideCreator && (!user || (!isAdmin && user.id !== data.creatorId))) {
      data.creator = null;
    }
    return data;
  });

  return {
    articles: articlesWithVisibility,
    users,
    usersCount,
    polls: pollsWithVisibility
  };
};

/**
 * Create a location request.
 * Returns { error, status } on failure or { request } on success.
 */
const createLocationRequest = async (requestData, userId) => {
  const { countryName, countryNameLocal, notes } = requestData;

  if (!countryName || !countryName.trim()) {
    return { error: 'Country name in English is required', status: 400 };
  }

  const request = await LocationRequest.create({
    countryName: countryName.trim(),
    countryNameLocal: countryNameLocal ? countryNameLocal.trim() : null,
    notes: notes ? notes.trim() : null,
    requestedByUserId: userId || null,
    status: 'pending'
  });

  return { request };
};

/**
 * List location requests with pagination.
 * Returns { requests, total, page, totalPages }.
 */
const getLocationRequests = async (query) => {
  const { status, page = 1, limit = 20 } = query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const locationRequestWhere = {};
  if (status) {
    locationRequestWhere.status = status;
  }

  const { count, rows } = await LocationRequest.findAndCountAll({
    where: locationRequestWhere,
    include: [
      { model: User, as: 'requestedBy', attributes: ['id', 'username', 'firstName', 'lastName'] },
      { model: User, as: 'reviewedBy', attributes: ['id', 'username', 'firstName', 'lastName'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset
  });

  return {
    requests: rows,
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / parseInt(limit))
  };
};

/**
 * Update a location request status.
 * Returns { error, status } on failure or { request } on success.
 */
const updateLocationRequest = async (id, updateData, reviewerUserId) => {
  const { status, reviewNotes } = updateData;

  const validStatuses = ['pending', 'approved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return { error: 'Invalid status. Must be pending, approved, or rejected', status: 400 };
  }

  const request = await LocationRequest.findByPk(id);
  if (!request) {
    return { error: 'Location request not found', status: 404 };
  }

  await request.update({
    status,
    reviewNotes: reviewNotes ? reviewNotes.trim() : null,
    reviewedByUserId: reviewerUserId,
    reviewedAt: new Date()
  });

  return { request };
};

module.exports = {
  createLocation,
  getLocations,
  getLocation,
  updateLocation,
  deleteLocation,
  linkLocation,
  unlinkLocation,
  getEntityLocations,
  getLocationEntities,
  createLocationRequest,
  getLocationRequests,
  updateLocationRequest
};
