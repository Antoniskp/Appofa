'use strict';

const { Op } = require('sequelize');
const { VideoPin, Location, User } = require('../models');
const {
  validateAndParseUrl,
  normalizeUrl: normalizePreviewUrl,
  buildPreview,
  extractYouTubeVideoId,
  extractTikTokVideoId
} = require('../controllers/linkPreviewController');

const CONTENT_TYPES = VideoPin.CONTENT_TYPES;
const CATEGORIES = VideoPin.CATEGORIES;
const STATUSES = VideoPin.STATUSES;
const PUBLIC_VISIBLE_STATUSES = ['approved'];
const TERMINAL_PUBLIC_LIVE_STATUSES = ['ended', 'broken', 'hidden', 'removed', 'expired'];
const DEFAULT_CATEGORY = 'local-news';
const DEFAULT_LIVE_EXPIRY_HOURS = 24;
const MAX_LIVE_EXPIRY_HOURS = 72;
const TITLE_FALLBACK = 'Video pin';
const TITLE_MAX = 255;
const DESCRIPTION_MAX = 2000;

function isModeratorRole(role) {
  return ['admin', 'moderator'].includes(role);
}

function normalizeEnum(value, allowed, fieldName, fallback) {
  if (value === undefined || value === null || value === '') {
    if (fallback !== undefined) return { value: fallback };
    return { error: `${fieldName} is required.` };
  }
  const normalized = String(value).trim();
  if (!allowed.includes(normalized)) {
    return { error: `${fieldName} must be one of: ${allowed.join(', ')}.` };
  }
  return { value: normalized };
}

function normalizeOptionalText(value, fieldName, maxLength) {
  if (value === undefined) return { value: undefined };
  if (value === null) return { value: null };
  if (typeof value !== 'string') return { error: `${fieldName} must be a string.` };
  const trimmed = value.trim();
  if (!trimmed) return { value: null };
  if (trimmed.length > maxLength) return { error: `${fieldName} must be ${maxLength} characters or fewer.` };
  return { value: trimmed };
}

function normalizeCoordinate(value, min, max, fieldName) {
  if (value === undefined || value === null || value === '') {
    return { error: `${fieldName} is required.` };
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return { error: `${fieldName} must be a number between ${min} and ${max}.` };
  }
  return { value: parsed };
}

function normalizeOptionalPositiveInt(value, fieldName) {
  if (value === undefined || value === null || value === '') return { value: null };
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return { error: `${fieldName} must be a positive integer.` };
  }
  return { value: parsed };
}

function truncate(value, maxLength) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function extractTikTokCreatorHandle(urlObj, embedHtml) {
  const pathMatch = urlObj.pathname.match(/\/@([^/]+)/);
  if (pathMatch) return `@${decodeURIComponent(pathMatch[1])}`;

  if (embedHtml) {
    const citeMatch = String(embedHtml).match(/https:\/\/www\.tiktok\.com\/@([^/"?#]+)/);
    if (citeMatch) return `@${decodeURIComponent(citeMatch[1])}`;
  }

  return null;
}

function extractCanonicalFromEmbedHtml(embedHtml) {
  if (!embedHtml) return null;
  const citeMatch = String(embedHtml).match(/cite=["']([^"']+)["']/);
  if (!citeMatch) return null;
  try {
    const parsed = new URL(citeMatch[1]);
    return parsed.hostname.endsWith('tiktok.com') ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function buildCreatorUrl(provider, handle) {
  if (provider !== 'tiktok' || !handle) return null;
  const normalizedHandle = handle.startsWith('@') ? handle.slice(1) : handle;
  return `https://www.tiktok.com/@${encodeURIComponent(normalizedHandle)}`;
}

function buildProviderVideoId(provider, urlObj, preview) {
  if (provider === 'youtube') return extractYouTubeVideoId(urlObj);
  if (provider === 'tiktok') {
    if (preview?.embedUrl) {
      const embedMatch = String(preview.embedUrl).match(/\/embed\/v2\/([^/?#]+)/);
      if (embedMatch) return decodeURIComponent(embedMatch[1]);
    }
    return extractTikTokVideoId(urlObj);
  }
  return null;
}

function normalizeProviderPayload(urlObj, provider, cacheKey, preview) {
  const creatorHandle = provider === 'tiktok'
    ? extractTikTokCreatorHandle(urlObj, preview?.embedHtml)
    : null;
  const canonicalFromEmbed = provider === 'tiktok'
    ? extractCanonicalFromEmbedHtml(preview?.embedHtml)
    : null;
  const providerVideoId = buildProviderVideoId(provider, urlObj, preview);
  const canonicalUrl = canonicalFromEmbed || cacheKey || preview?.url || urlObj.toString();
  const creatorName = truncate(preview?.authorName, 255);
  const creatorUrl = buildCreatorUrl(provider, creatorHandle);

  return {
    sourceProvider: provider,
    sourceUrl: preview?.url || urlObj.toString(),
    canonicalUrl,
    providerVideoId,
    creatorHandle,
    creatorName,
    creatorUrl,
    thumbnailUrl: truncate(preview?.thumbnailUrl, 2048),
    embedUrl: truncate(preview?.embedUrl, 2048),
    embedHtml: typeof preview?.embedHtml === 'string' ? preview.embedHtml.slice(0, 65535) : null,
    sourceMeta: {
      ...(preview || {}),
      canonicalUrl,
      providerVideoId,
      creatorHandle,
      creatorName,
      creatorUrl
    }
  };
}

function normalizeLiveExpiry(contentType, expiresAt, expiresInHours, now = new Date()) {
  if (contentType !== 'live') return { value: null };

  if (expiresAt) {
    const parsed = new Date(expiresAt);
    if (Number.isNaN(parsed.getTime())) return { error: 'expiresAt must be a valid date.' };
    if (parsed <= now) return { error: 'expiresAt must be in the future.' };
    const hoursAhead = (parsed.getTime() - now.getTime()) / (60 * 60 * 1000);
    if (hoursAhead > MAX_LIVE_EXPIRY_HOURS) {
      return { error: `Live pins can expire at most ${MAX_LIVE_EXPIRY_HOURS} hours in the future.` };
    }
    return { value: parsed };
  }

  const hours = expiresInHours === undefined || expiresInHours === null || expiresInHours === ''
    ? DEFAULT_LIVE_EXPIRY_HOURS
    : Number(expiresInHours);
  if (!Number.isFinite(hours) || hours <= 0 || hours > MAX_LIVE_EXPIRY_HOURS) {
    return { error: `expiresInHours must be between 1 and ${MAX_LIVE_EXPIRY_HOURS}.` };
  }
  return { value: new Date(now.getTime() + hours * 60 * 60 * 1000) };
}

function serializeVideoPin(pin) {
  const data = pin?.toJSON ? pin.toJSON() : pin;
  if (!data) return null;
  return {
    ...data,
    lat: Number(data.lat),
    lng: Number(data.lng),
    location: data.location || null,
    submittedBy: data.submittedBy || null,
    moderatedBy: data.moderatedBy || null,
    isExpired: data.contentType === 'live' && data.expiresAt ? new Date(data.expiresAt) <= new Date() : false
  };
}

function buildPublicWhere(query = {}, user = null) {
  const includeAll = query.include === 'all' && isModeratorRole(user?.role);
  const where = {};

  if (!includeAll) {
    const now = new Date();
    where.status = { [Op.in]: PUBLIC_VISIBLE_STATUSES };
    where[Op.and] = [
      {
        [Op.or]: [
          { contentType: 'viral' },
          {
            contentType: 'live',
            status: { [Op.notIn]: TERMINAL_PUBLIC_LIVE_STATUSES },
            [Op.or]: [
              { expiresAt: null },
              { expiresAt: { [Op.gt]: now } }
            ]
          }
        ]
      }
    ];
  } else if (query.status && STATUSES.includes(query.status)) {
    where.status = query.status;
  }

  if (query.contentType && query.contentType !== 'all') {
    if (!CONTENT_TYPES.includes(query.contentType)) {
      return { error: `contentType must be one of: ${CONTENT_TYPES.join(', ')}, all.` };
    }
    where.contentType = query.contentType;
  }

  if (query.category && query.category !== 'all') {
    if (!CATEGORIES.includes(query.category)) {
      return { error: `category must be one of: ${CATEGORIES.join(', ')}, all.` };
    }
    where.category = query.category;
  }

  return { where, includeAll };
}

function buildOrder(sort) {
  if (sort === 'expiresSoon') {
    return [['expiresAt', 'ASC'], ['createdAt', 'DESC']];
  }
  if (sort === 'recentlyApproved') {
    return [['moderatedAt', 'DESC'], ['updatedAt', 'DESC']];
  }
  if (sort === 'category') {
    return [['category', 'ASC'], ['createdAt', 'DESC']];
  }
  return [['createdAt', 'DESC']];
}

async function getVideoPins(query = {}, user = null) {
  const whereResult = buildPublicWhere(query, user);
  if (whereResult.error) return { success: false, status: 400, message: whereResult.error };

  const pins = await VideoPin.findAll({
    where: whereResult.where,
    include: [
      {
        model: Location,
        as: 'location',
        attributes: ['id', 'name', 'name_local', 'slug', 'type', 'lat', 'lng'],
        required: false
      },
      {
        model: User,
        as: 'submittedBy',
        attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'avatarColor', 'isVerified'],
        required: false
      },
      {
        model: User,
        as: 'moderatedBy',
        attributes: ['id', 'username'],
        required: false
      }
    ],
    order: buildOrder(query.sort)
  });

  return { success: true, data: { videoPins: pins.map(serializeVideoPin) } };
}

async function createVideoPin(user, input = {}) {
  if (!user?.id) return { success: false, status: 401, message: 'Authentication required.' };

  const contentTypeResult = normalizeEnum(input.contentType, CONTENT_TYPES, 'contentType');
  if (contentTypeResult.error) return { success: false, status: 400, message: contentTypeResult.error };

  const categoryResult = normalizeEnum(input.category, CATEGORIES, 'category', DEFAULT_CATEGORY);
  if (categoryResult.error) return { success: false, status: 400, message: categoryResult.error };

  const latResult = normalizeCoordinate(input.lat, -90, 90, 'lat');
  if (latResult.error) return { success: false, status: 400, message: latResult.error };

  const lngResult = normalizeCoordinate(input.lng, -180, 180, 'lng');
  if (lngResult.error) return { success: false, status: 400, message: lngResult.error };

  const locationIdResult = normalizeOptionalPositiveInt(input.locationId, 'locationId');
  if (locationIdResult.error) return { success: false, status: 400, message: locationIdResult.error };

  if (locationIdResult.value) {
    const location = await Location.findByPk(locationIdResult.value);
    if (!location) return { success: false, status: 404, message: 'Location not found.' };
  }

  const descriptionResult = normalizeOptionalText(input.description, 'description', DESCRIPTION_MAX);
  if (descriptionResult.error) return { success: false, status: 400, message: descriptionResult.error };

  let urlObj, provider;
  try {
    ({ urlObj, provider } = validateAndParseUrl(input.sourceUrl));
  } catch (err) {
    return { success: false, status: err.statusCode || 400, message: err.message };
  }

  const cacheKey = normalizePreviewUrl(urlObj, provider);
  const preview = await buildPreview(urlObj, provider, input.sourceUrl.trim());
  const providerPayload = normalizeProviderPayload(urlObj, provider, cacheKey, preview);

  if (providerPayload.providerVideoId) {
    const duplicate = await VideoPin.findOne({
      where: {
        sourceProvider: provider,
        providerVideoId: providerPayload.providerVideoId,
        status: { [Op.ne]: 'removed' }
      }
    });
    if (duplicate) {
      return {
        success: false,
        status: 409,
        message: 'This video is already pinned.',
        data: { existingPin: serializeVideoPin(duplicate) }
      };
    }
  }

  const title = truncate(input.title, TITLE_MAX)
    || truncate(providerPayload.sourceMeta?.title, TITLE_MAX)
    || TITLE_FALLBACK;
  const expiryResult = normalizeLiveExpiry(contentTypeResult.value, input.expiresAt, input.expiresInHours);
  if (expiryResult.error) return { success: false, status: 400, message: expiryResult.error };

  const canApprove = isModeratorRole(user.role);
  const now = new Date();
  const pin = await VideoPin.create({
    contentType: contentTypeResult.value,
    category: categoryResult.value,
    status: canApprove ? 'approved' : 'pending',
    ...providerPayload,
    title,
    description: descriptionResult.value ?? null,
    lat: latResult.value,
    lng: lngResult.value,
    locationId: locationIdResult.value,
    expiresAt: expiryResult.value,
    submittedByUserId: user.id,
    moderatedByUserId: canApprove ? user.id : null,
    moderatedAt: canApprove ? now : null
  });

  const created = await VideoPin.findByPk(pin.id, {
    include: [
      { model: Location, as: 'location', required: false },
      { model: User, as: 'submittedBy', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'avatarColor', 'isVerified'], required: false },
      { model: User, as: 'moderatedBy', attributes: ['id', 'username'], required: false }
    ]
  });

  return { success: true, data: { videoPin: serializeVideoPin(created) } };
}

async function updateVideoPin(user, id, input = {}) {
  if (!isModeratorRole(user?.role)) return { success: false, status: 403, message: 'Insufficient permissions. Access denied.' };

  const pin = await VideoPin.findByPk(id);
  if (!pin) return { success: false, status: 404, message: 'Video pin not found.' };

  if (input.status !== undefined) {
    const statusResult = normalizeEnum(input.status, STATUSES, 'status');
    if (statusResult.error) return { success: false, status: 400, message: statusResult.error };
    pin.status = statusResult.value;
    pin.moderatedByUserId = user.id;
    pin.moderatedAt = new Date();
  }

  if (input.category !== undefined) {
    const categoryResult = normalizeEnum(input.category, CATEGORIES, 'category');
    if (categoryResult.error) return { success: false, status: 400, message: categoryResult.error };
    pin.category = categoryResult.value;
  }

  if (input.title !== undefined) {
    const title = truncate(input.title, TITLE_MAX);
    if (!title) return { success: false, status: 400, message: 'title is required.' };
    pin.title = title;
  }

  if (input.description !== undefined) {
    const descriptionResult = normalizeOptionalText(input.description, 'description', DESCRIPTION_MAX);
    if (descriptionResult.error) return { success: false, status: 400, message: descriptionResult.error };
    pin.description = descriptionResult.value;
  }

  if (input.lat !== undefined) {
    const latResult = normalizeCoordinate(input.lat, -90, 90, 'lat');
    if (latResult.error) return { success: false, status: 400, message: latResult.error };
    pin.lat = latResult.value;
  }

  if (input.lng !== undefined) {
    const lngResult = normalizeCoordinate(input.lng, -180, 180, 'lng');
    if (lngResult.error) return { success: false, status: 400, message: lngResult.error };
    pin.lng = lngResult.value;
  }

  if (input.locationId !== undefined) {
    const locationIdResult = normalizeOptionalPositiveInt(input.locationId, 'locationId');
    if (locationIdResult.error) return { success: false, status: 400, message: locationIdResult.error };
    if (locationIdResult.value) {
      const location = await Location.findByPk(locationIdResult.value);
      if (!location) return { success: false, status: 404, message: 'Location not found.' };
    }
    pin.locationId = locationIdResult.value;
  }

  if (input.expiresAt !== undefined || input.expiresInHours !== undefined) {
    const expiryResult = normalizeLiveExpiry(pin.contentType, input.expiresAt, input.expiresInHours);
    if (expiryResult.error) return { success: false, status: 400, message: expiryResult.error };
    pin.expiresAt = expiryResult.value;
  }

  await pin.save();

  const updated = await VideoPin.findByPk(pin.id, {
    include: [
      { model: Location, as: 'location', required: false },
      { model: User, as: 'submittedBy', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'avatarColor', 'isVerified'], required: false },
      { model: User, as: 'moderatedBy', attributes: ['id', 'username'], required: false }
    ]
  });

  return { success: true, data: { videoPin: serializeVideoPin(updated) } };
}

async function removeVideoPin(user, id) {
  if (!isModeratorRole(user?.role)) return { success: false, status: 403, message: 'Insufficient permissions. Access denied.' };

  const pin = await VideoPin.findByPk(id);
  if (!pin) return { success: false, status: 404, message: 'Video pin not found.' };

  pin.status = 'removed';
  pin.moderatedByUserId = user.id;
  pin.moderatedAt = new Date();
  await pin.save();

  return { success: true };
}

module.exports = {
  CONTENT_TYPES,
  CATEGORIES,
  STATUSES,
  DEFAULT_LIVE_EXPIRY_HOURS,
  MAX_LIVE_EXPIRY_HOURS,
  normalizeLiveExpiry,
  normalizeProviderPayload,
  buildPublicWhere,
  serializeVideoPin,
  getVideoPins,
  createVideoPin,
  updateVideoPin,
  removeVideoPin
};
