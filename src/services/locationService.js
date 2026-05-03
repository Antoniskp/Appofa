'use strict';

const { sequelize, Location, LocationLink, Article, User, UserLocationRole, Poll, LocationRequest } = require('../models');
const { Op, fn, col, where, QueryTypes } = require('sequelize');
const { fetchWikipediaData } = require('../utils/wikipediaFetcher');
const { getDescendantLocationIds, getAncestorLocationIds, getManageableLocationIdsFromAssignments } = require('../utils/locationUtils');

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

const generateSlug = (name, _type) => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
};

const isValidWikipediaUrl = (url) => {
  if (!url) return true;
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.endsWith('.wikipedia.org');
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Create a new location.
 * @param {object} locationData - fields from req.body
 * @returns {Promise<{success: boolean, status?: number, message?: string, location?: object}>}
 */
const createLocation = async (locationData) => {
  try {
    const { name, name_local, type, parent_id, code, lat, lng, bounding_box, wikipedia_url } = locationData;
    const normalizedName = typeof name === 'string' ? name.trim() : '';

    if (!normalizedName || !type) {
      return { success: false, status: 400, message: 'Name and type are required' };
    }

    const validTypes = ['international', 'country', 'prefecture', 'municipality'];
    if (!validTypes.includes(type)) {
      return { success: false, status: 400, message: 'Invalid location type' };
    }

    if (wikipedia_url && !isValidWikipediaUrl(wikipedia_url)) {
      return {
        success: false, status: 400,
        message: 'Invalid Wikipedia URL. Must be a valid Wikipedia domain URL (e.g., https://en.wikipedia.org/wiki/...)'
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
      return { success: false, status: 409, message: 'Location with this name already exists at this level' };
    }

    if (parent_id) {
      const parent = await Location.findByPk(parent_id);
      if (!parent) {
        return { success: false, status: 404, message: 'Parent location not found' };
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

    return { success: true, location };
  } catch (error) {
    console.error('Error creating location:', error);
    return {
      success: false, status: 500,
      message: 'Failed to create location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Get all locations with optional filtering.
 * @param {object} queryParams - from req.query
 * @param {object|null} user - plain user object { id, role } or null (for auth check)
 * @returns {Promise<{success: boolean, status?: number, message?: string, locations?: object[], pagination?: object}>}
 */
const getLocations = async (queryParams) => {
  try {
    const { type, parent_id, search, code, limit = 100, offset = 0, sort } = queryParams;
    const escapedSearch = search ? search.replace(/[\\%_]/g, '\\$&') : null;

    const whereClause = {};

    if (type) {
      whereClause.type = type;
    }

    if (parent_id !== undefined) {
      whereClause.parent_id = parent_id === 'null' || parent_id === '' ? null : parent_id;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${escapedSearch}%` } },
        { name_local: { [Op.iLike]: `%${escapedSearch}%` } }
      ];
    }

    if (code) {
      whereClause.code = String(code).toUpperCase();
    }

    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);
    let locations;

    if (sort === 'mostUsers') {
      const whereConditions = [];
      const replacements = { limit: parsedLimit, offset: parsedOffset };

      if (type) {
        whereConditions.push('l."type" = :type');
        replacements.type = type;
      }

      if (parent_id !== undefined) {
        if (parent_id === 'null' || parent_id === '') {
          whereConditions.push('l."parent_id" IS NULL');
        } else {
          whereConditions.push('l."parent_id" = :parentId');
          replacements.parentId = parent_id;
        }
      }

      if (search) {
        whereConditions.push('(LOWER(l."name") LIKE :search ESCAPE \'\\\\\' OR LOWER(COALESCE(l."name_local", \'\')) LIKE :search ESCAPE \'\\\\\')');
        replacements.search = `%${escapedSearch.toLowerCase()}%`;
      }

      if (code) {
        whereConditions.push('UPPER(COALESCE(l."code", \'\')) = :code');
        replacements.code = String(code).toUpperCase();
      }

      const whereSql = whereConditions.length > 0 ? ` AND ${whereConditions.join(' AND ')}` : '';

      const locationsRaw = await sequelize.query(
        `WITH RECURSIVE location_tree AS (
          SELECT l.id AS ancestor_id, l.id AS descendant_id
          FROM "Locations" l
          UNION ALL
          SELECT lt.ancestor_id, child.id AS descendant_id
          FROM location_tree lt
          JOIN "Locations" child ON child.parent_id = lt.descendant_id
        ),
        real_users AS (
          SELECT lt.ancestor_id AS location_id, ll.entity_id AS user_id
          FROM location_tree lt
          JOIN "LocationLinks" ll
            ON ll.location_id = lt.descendant_id
           AND ll.entity_type = 'user'
          JOIN "Users" u ON u.id = ll.entity_id
          WHERE u."claimStatus" IS NULL
          UNION
          SELECT lt.ancestor_id AS location_id, u.id AS user_id
          FROM location_tree lt
          JOIN "Users" u ON u."homeLocationId" = lt.descendant_id
          WHERE u.searchable = true
            AND u."claimStatus" IS NULL
        ),
        user_counts AS (
          SELECT location_id, COUNT(DISTINCT user_id) AS "userCount"
          FROM real_users
          GROUP BY location_id
        )
        SELECT
          l.*,
          COALESCE(uc."userCount", 0) AS "userCount",
          parent.id AS "parentId",
          parent.name AS "parentName",
          parent.type AS "parentType"
        FROM "Locations" l
        LEFT JOIN user_counts uc ON uc.location_id = l.id
        LEFT JOIN "Locations" parent ON parent.id = l.parent_id
        WHERE 1=1${whereSql}
        ORDER BY "userCount" DESC, l.name ASC
        LIMIT :limit OFFSET :offset`,
        {
          replacements,
          type: QueryTypes.SELECT
        }
      );

      locations = locationsRaw.map((row) => ({
        ...row,
        parent: row.parentId !== null
          ? { id: row.parentId, name: row.parentName, type: row.parentType }
          : null
      }));
    } else {
      const findOptions = {
        where: whereClause,
        limit: parsedLimit,
        offset: parsedOffset,
        order: [['name', 'ASC']],
        include: [
          {
            model: Location,
            as: 'parent',
            attributes: ['id', 'name', 'type']
          }
        ]
      };

      locations = await Location.findAll(findOptions);
    }

    const locationIds = locations.map((location) => location.id);
    const moderatorLocationIds = new Set();
    const moderatorPreviewByLocationId = new Map();

    if (locationIds.length > 0) {
      // Use UserLocationRole join table: find moderator assignments for these exact locations
      const moderatorAssignments = await UserLocationRole.findAll({
        where: {
          locationId: { [Op.in]: locationIds },
          roleKey: 'moderator',
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'avatarColor'],
            required: true,
          },
        ],
        order: [['createdAt', 'ASC'], ['id', 'ASC']],
      });

      moderatorAssignments.forEach((assignment) => {
        const locId = Number(assignment.locationId);
        if (Number.isInteger(locId) && assignment.user) {
          moderatorLocationIds.add(locId);

          if (!moderatorPreviewByLocationId.has(locId)) {
            moderatorPreviewByLocationId.set(locId, {
              id: assignment.user.id,
              username: assignment.user.username,
              firstNameNative: assignment.user.firstNameNative,
              lastNameNative: assignment.user.lastNameNative,
              avatar: assignment.user.avatar,
              avatarColor: assignment.user.avatarColor,
            });
          }
        }
      });
    }

    const locationsWithModeratorStatus = locations.map((location) => {
      const serializedLocation = location.toJSON ? location.toJSON() : { ...location };
      const hasUserCount = serializedLocation.userCount !== undefined && serializedLocation.userCount !== null;
      const locationId = Number(serializedLocation.id);
      return {
        ...serializedLocation,
        ...(hasUserCount ? { userCount: Number.parseInt(serializedLocation.userCount, 10) || 0 } : {}),
        hasModerator: moderatorLocationIds.has(locationId),
        moderatorPreview: moderatorPreviewByLocationId.get(locationId) || null
      };
    });

    const total = await Location.count({ where: whereClause });

    return {
      success: true,
      locations: locationsWithModeratorStatus,
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset
      }
    };
  } catch (error) {
    console.error('Error fetching locations:', error);
    return {
      success: false, status: 500,
      message: 'Failed to fetch locations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Get a single location by ID or slug.
 * @param {string} id - numeric ID or slug string
 * @returns {Promise<{success: boolean, status?: number, message?: string, location?: object, stats?: object}>}
 */
const getLocation = async (id) => {
  try {
    const isNumericId = /^\d+$/.test(id);
    const findOptions = {
      include: [
        {
          model: Location,
          as: 'parent',
          attributes: ['id', 'name', 'type', 'slug'],
          include: [
            {
              model: Location,
              as: 'parent',
              attributes: ['id', 'name', 'type', 'slug'],
              include: [
                {
                  model: Location,
                  as: 'parent',
                  attributes: ['id', 'name', 'type', 'slug']
                }
              ]
            }
          ]
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
      return { success: false, status: 404, message: 'Location not found' };
    }

    const locationId = location.id;
    const articleCount = await LocationLink.count({
      where: { location_id: locationId, entity_type: 'article' }
    });
    const allLocationIds = [locationId, ...(await getDescendantLocationIds(locationId))];
    const linkedRows = await LocationLink.findAll({
      where: { location_id: { [Op.in]: allLocationIds }, entity_type: 'user' },
      attributes: ['entity_id'],
      raw: true
    });
    const linkedUserIds = [...new Set(linkedRows.map((row) => row.entity_id))];
    const realLinkedCount = linkedUserIds.length > 0
      ? await User.count({
        where: {
          id: { [Op.in]: linkedUserIds },
          claimStatus: null
        }
      })
      : 0;

    const homeOnlyCount = await User.count({
      where: {
        homeLocationId: { [Op.in]: allLocationIds },
        searchable: true,
        claimStatus: null,
        ...(linkedUserIds.length > 0 ? { id: { [Op.notIn]: linkedUserIds } } : {})
      }
    });
    const userCount = realLinkedCount + homeOnlyCount;
    const pollCount = await LocationLink.count({
      where: { location_id: locationId, entity_type: 'poll' }
    });

    const moderatorAssignment = await UserLocationRole.findOne({
      where: { locationId, roleKey: 'moderator' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'avatarColor'],
          required: true,
        },
      ],
      order: [['createdAt', 'ASC'], ['id', 'ASC']],
    });

    const moderator = moderatorAssignment ? moderatorAssignment.user : null;

    const locationData = location.toJSON();
    locationData.hasModerator = !!moderator;
    locationData.moderatorPreview = moderator ? moderator.toJSON() : null;

    return {
      success: true,
      location: locationData,
      stats: {
        articleCount,
        userCount,
        pollCount,
        childrenCount: location.children?.length || 0
      }
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    return {
      success: false, status: 500,
      message: 'Failed to fetch location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Update a location.
 * @param {string|number} id - location primary key
 * @param {object} updateData - fields from req.body
 * @returns {Promise<{success: boolean, status?: number, message?: string, location?: object}>}
 */
const updateLocation = async (id, updateData, actorRole = null, actorUserId = null) => {
  try {
    const { name, name_local, type, parent_id, code, lat, lng, bounding_box, wikipedia_url, population_override } = updateData;

    const location = await Location.findByPk(id);
    if (!location) {
      return { success: false, status: 404, message: 'Location not found' };
    }

    if (actorRole === 'moderator') {
      if (!actorUserId) {
        return { success: false, status: 403, message: 'Moderator must have an assigned location.' };
      }
      const assignments = await UserLocationRole.findAll({
        where: { userId: actorUserId, roleKey: 'moderator' },
        attributes: ['locationId'],
      });
      if (assignments.length === 0) {
        return { success: false, status: 403, message: 'Moderator must have an assigned location.' };
      }
      const allowedIds = await getManageableLocationIdsFromAssignments(assignments);
      const allowedIdSet = new Set(allowedIds);
      if (!allowedIdSet.has(Number(location.id))) {
        return { success: false, status: 403, message: 'Forbidden: location outside your scope.' };
      }
    }

    if (wikipedia_url !== undefined && wikipedia_url !== null && wikipedia_url !== '' && !isValidWikipediaUrl(wikipedia_url)) {
      return {
        success: false, status: 400,
        message: 'Invalid Wikipedia URL. Must be a valid Wikipedia domain URL (e.g., https://en.wikipedia.org/wiki/...)'
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
        return { success: false, status: 409, message: 'Location with this name already exists at this level' };
      }
    }

    const locationUpdateData = {
      name: name || location.name,
      name_local: name_local !== undefined ? name_local : location.name_local,
      type: type || location.type,
      parent_id: parent_id !== undefined ? (parent_id || null) : location.parent_id,
      code: code !== undefined ? code : location.code,
      slug,
      lat: lat !== undefined ? lat : location.lat,
      lng: lng !== undefined ? lng : location.lng,
      bounding_box: bounding_box !== undefined ? bounding_box : location.bounding_box,
      wikipedia_url: wikipedia_url !== undefined ? wikipedia_url : location.wikipedia_url,
      population_override: population_override !== undefined ? (() => {
        if (population_override === null || population_override === '' || population_override === undefined) return null;
        const v = parseInt(population_override, 10);
        return isNaN(v) ? null : v;
      })() : location.population_override
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

    return { success: true, location };
  } catch (error) {
    console.error('Error updating location:', error);
    return {
      success: false, status: 500,
      message: 'Failed to update location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Delete a location.
 * @param {string|number} id - location primary key
 * @returns {Promise<{success: boolean, status?: number, message?: string}>}
 */
const deleteLocation = async (id, actorRole = null, actorUserId = null) => {
  try {
    const location = await Location.findByPk(id);
    if (!location) {
      return { success: false, status: 404, message: 'Location not found' };
    }

    if (actorRole === 'moderator') {
      if (!actorUserId) {
        return { success: false, status: 403, message: 'Moderator must have an assigned location.' };
      }
      const assignments = await UserLocationRole.findAll({
        where: { userId: actorUserId, roleKey: 'moderator' },
        attributes: ['locationId'],
      });
      if (assignments.length === 0) {
        return { success: false, status: 403, message: 'Moderator must have an assigned location.' };
      }
      const allowedIds = await getManageableLocationIdsFromAssignments(assignments);
      const allowedIdSet = new Set(allowedIds);
      if (!allowedIdSet.has(Number(location.id))) {
        return { success: false, status: 403, message: 'Forbidden: location outside your scope.' };
      }
    }

    const childrenCount = await Location.count({ where: { parent_id: id } });
    if (childrenCount > 0) {
      return { success: false, status: 400, message: 'Cannot delete location with child locations' };
    }

    await location.destroy();
    return { success: true };
  } catch (error) {
    console.error('Error deleting location:', error);
    return {
      success: false, status: 500,
      message: 'Failed to delete location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Link a location to an entity.
 * @param {object} linkData - { location_id, entity_type, entity_id }
 * @param {object} user - plain user object { id, role }
 * @returns {Promise<{success: boolean, status?: number, message?: string, link?: object}>}
 */
const linkLocation = async (linkData, user) => {
  try {
    const { location_id, entity_type, entity_id } = linkData;

    if (!location_id || !entity_type || !entity_id) {
      return { success: false, status: 400, message: 'location_id, entity_type, and entity_id are required' };
    }

    if (!['article', 'user', 'poll'].includes(entity_type)) {
      return { success: false, status: 400, message: 'entity_type must be either "article", "user", or "poll"' };
    }

    const location = await Location.findByPk(location_id);
    if (!location) {
      return { success: false, status: 404, message: 'Location not found' };
    }

    if (entity_type === 'article') {
      const article = await Article.findByPk(entity_id);
      if (!article) {
        return { success: false, status: 404, message: 'Article not found' };
      }
      if (article.authorId !== user.id && !['admin', 'moderator'].includes(user.role)) {
        return { success: false, status: 403, message: 'Not authorized to link this article' };
      }
    } else if (entity_type === 'user') {
      const linkedUser = await User.findByPk(entity_id);
      if (!linkedUser) {
        return { success: false, status: 404, message: 'User not found' };
      }
      if (linkedUser.id !== user.id && user.role !== 'admin') {
        return { success: false, status: 403, message: 'Not authorized to link this user' };
      }
    } else if (entity_type === 'poll') {
      const poll = await Poll.findByPk(entity_id);
      if (!poll) {
        return { success: false, status: 404, message: 'Poll not found' };
      }
      if (poll.creatorId !== user.id && !['admin', 'moderator'].includes(user.role)) {
        return { success: false, status: 403, message: 'Not authorized to link this poll' };
      }
    }

    const existingLink = await LocationLink.findOne({
      where: { location_id, entity_type, entity_id }
    });

    if (existingLink) {
      return { success: false, status: 409, message: 'Location link already exists' };
    }

    const link = await LocationLink.create({ location_id, entity_type, entity_id });

    return { success: true, link };
  } catch (error) {
    console.error('Error linking location:', error);
    return {
      success: false, status: 500,
      message: 'Failed to link location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Unlink a location from an entity.
 * @param {object} linkData - { location_id, entity_type, entity_id }
 * @param {object} user - plain user object { id, role }
 * @returns {Promise<{success: boolean, status?: number, message?: string}>}
 */
const unlinkLocation = async (linkData, user) => {
  try {
    const { location_id, entity_type, entity_id } = linkData;

    if (!location_id || !entity_type || !entity_id) {
      return { success: false, status: 400, message: 'location_id, entity_type, and entity_id are required' };
    }

    if (entity_type === 'article') {
      const article = await Article.findByPk(entity_id);
      if (article && article.authorId !== user.id && !['admin', 'moderator'].includes(user.role)) {
        return { success: false, status: 403, message: 'Not authorized to unlink this article' };
      }
    } else if (entity_type === 'user') {
      if (parseInt(entity_id) !== user.id && user.role !== 'admin') {
        return { success: false, status: 403, message: 'Not authorized to unlink this user' };
      }
    } else if (entity_type === 'poll') {
      const poll = await Poll.findByPk(entity_id);
      if (poll && poll.creatorId !== user.id && !['admin', 'moderator'].includes(user.role)) {
        return { success: false, status: 403, message: 'Not authorized to unlink this poll' };
      }
    }

    const link = await LocationLink.findOne({
      where: { location_id, entity_type, entity_id }
    });

    if (!link) {
      return { success: false, status: 404, message: 'Location link not found' };
    }

    await link.destroy();
    return { success: true };
  } catch (error) {
    console.error('Error unlinking location:', error);
    return {
      success: false, status: 500,
      message: 'Failed to unlink location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Get all locations linked to an entity.
 * @param {string} entity_type - 'article', 'user', or 'poll'
 * @param {string|number} entity_id - entity primary key
 * @returns {Promise<{success: boolean, status?: number, message?: string, locations?: object[]}>}
 */
const getEntityLocations = async (entity_type, entity_id) => {
  try {
    if (!['article', 'user', 'poll'].includes(entity_type)) {
      return { success: false, status: 400, message: 'entity_type must be either "article", "user", or "poll"' };
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

    return { success: true, locations };
  } catch (error) {
    console.error('Error fetching entity locations:', error);
    return {
      success: false, status: 500,
      message: 'Failed to fetch entity locations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Get all entities (articles/users/polls) linked to a location.
 * @param {string|number} locationId - location primary key
 * @param {object} queryParams - { entity_type? }
 * @param {object|null} user - plain user object { id, role } or null
 * @returns {Promise<{success: boolean, status?: number, message?: string, articles?: object[], users?: object[], usersCount?: number, polls?: object[]}>}
 */
const getLocationEntities = async (locationId, queryParams, user) => {
  try {
    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'admin';
    const { entity_type } = queryParams;

    const whereClause = { location_id: locationId };
    if (entity_type && ['article', 'user', 'poll'].includes(entity_type)) {
      whereClause.entity_type = entity_type;
    }

    const links = await LocationLink.findAll({
      where: whereClause,
      attributes: ['id', 'entity_type', 'entity_id']
    });

    const articleIds = links.filter(l => l.entity_type === 'article').map(l => l.entity_id);
    const userIds = links.filter(l => l.entity_type === 'user').map(l => l.entity_id);
    const pollIds = links.filter(l => l.entity_type === 'poll').map(l => l.entity_id);

    let combinedUserIds = userIds;
    if (!entity_type || entity_type === 'user') {
      const descendantIds = await getDescendantLocationIds(locationId);
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

      // Also include users whose homeLocationId is in the location tree
      // (e.g. moderators assigned via homeLocationId but not via LocationLink)
      const homeLocationUsers = await User.findAll({
        where: {
          homeLocationId: { [Op.in]: [locationId, ...descendantIds] },
          searchable: true
        },
        attributes: ['id']
      });

      const homeLocationUserIds = homeLocationUsers.map((u) => u.id);
      const constituencyPersons = await User.findAll({
        where: {
          constituencyId: { [Op.in]: [locationId, ...descendantIds] },
          claimStatus: { [Op.ne]: null }
        },
        attributes: ['id']
      });

      const constituencyPersonIds = constituencyPersons.map((u) => u.id);
      combinedUserIds = Array.from(new Set([...combinedUserIds, ...homeLocationUserIds, ...constituencyPersonIds]));
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

    const userEntities = combinedUserIds.length > 0 ? await User.findAll({
      where: {
        id: combinedUserIds,
        searchable: true
      },
      attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'avatarColor', 'claimStatus', 'photo', 'slug']
    }) : [];
    const users = userEntities.map((u) => (u.toJSON ? u.toJSON() : u));
    const regularUsers = users.filter((u) => u.claimStatus === null);
    const unclaimedUsers = users.filter((u) => u.claimStatus !== null);

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
      success: true,
      articles: articlesWithVisibility,
      users: isAuthenticated ? regularUsers : [],
      usersCount: regularUsers.length,
      unclaimed: isAuthenticated ? unclaimedUsers : [],
      unclaimedCount: unclaimedUsers.length,
      polls: pollsWithVisibility
    };
  } catch (error) {
    console.error('Error fetching location entities:', error);
    return {
      success: false, status: 500,
      message: 'Failed to fetch location entities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Create a new location request.
 * @param {object} requestData - { countryName, countryNameLocal, notes }
 * @param {number|null} userId - requesting user ID or null
 * @returns {Promise<{success: boolean, status?: number, message?: string, request?: object}>}
 */
const createLocationRequest = async (requestData, userId) => {
  try {
    const { countryName, countryNameLocal, notes } = requestData;

    if (!countryName || !countryName.trim()) {
      return { success: false, status: 400, message: 'Country name in English is required' };
    }

    const request = await LocationRequest.create({
      countryName: countryName.trim(),
      countryNameLocal: countryNameLocal ? countryNameLocal.trim() : null,
      notes: notes ? notes.trim() : null,
      requestedByUserId: userId || null,
      status: 'pending'
    });

    return { success: true, request };
  } catch (error) {
    console.error('Error creating location request:', error);
    return {
      success: false, status: 500,
      message: 'Failed to submit country request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * List location requests with pagination.
 * @param {object} queryParams - { status?, page?, limit? }
 * @returns {Promise<{success: boolean, status?: number, message?: string, requests?: object[], total?: number, page?: number, totalPages?: number}>}
 */
const getLocationRequests = async (queryParams) => {
  try {
    const { status, page = 1, limit = 20 } = queryParams;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await LocationRequest.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'requestedBy', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative'] },
        { model: User, as: 'reviewedBy', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return {
      success: true,
      requests: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit))
    };
  } catch (error) {
    console.error('Error fetching location requests:', error);
    return {
      success: false, status: 500,
      message: 'Failed to fetch location requests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Update a location request status.
 * @param {string|number} id - request primary key
 * @param {object} updateData - { status, reviewNotes }
 * @param {number} userId - reviewing user ID
 * @returns {Promise<{success: boolean, status?: number, message?: string, request?: object}>}
 */
const updateLocationRequest = async (id, updateData, userId) => {
  try {
    const { status, reviewNotes } = updateData;

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return { success: false, status: 400, message: 'Invalid status. Must be pending, approved, or rejected' };
    }

    const request = await LocationRequest.findByPk(id);
    if (!request) {
      return { success: false, status: 404, message: 'Location request not found' };
    }

    await request.update({
      status,
      reviewNotes: reviewNotes ? reviewNotes.trim() : null,
      reviewedByUserId: userId,
      reviewedAt: new Date()
    });

    return { success: true, request };
  } catch (error) {
    console.error('Error updating location request:', error);
    return {
      success: false, status: 500,
      message: 'Failed to update location request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
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
