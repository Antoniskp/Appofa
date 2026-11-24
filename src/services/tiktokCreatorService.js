const { Op, ForeignKeyConstraintError, UniqueConstraintError, col, fn, where: sqlWhere } = require('sequelize');
const { TikTokCreator, Location, User, sequelize } = require('../models');
const { createError } = require('../middleware/errorHandler');
const { getDescendantLocationIds } = require('../utils/locationUtils');
const { getDiscoverableVisibilities } = require('../utils/profileVisibility');
const { TIKTOK_CREATOR_CATEGORIES, TIKTOK_CREATOR_LOCATION_TYPES, getTikTokProfileHandle } = require('../../config/tiktokCreators');

const STATUSES = ['pending', 'approved', 'rejected'];
const PAGE_SIZE = 24;
const LOCATION_FIELDS = ['id', 'name', 'name_local', 'slug'];

function positiveId(value) {
  if (!['string', 'number'].includes(typeof value) || !/^\d+$/.test(String(value))) return null;
  const id = Number(value);
  return id > 0 && id <= 2147483647 ? id : null;
}

async function getMemberCreators(viewer) {
  const members = await User.findAll({
    where: {
      claimStatus: null,
      profileVisibility: { [Op.in]: getDiscoverableVisibilities(Boolean(viewer?.id)) },
      socialLinks: { [Op.like]: '%"tiktok"%' },
    },
    attributes: ['id', 'username', 'nickname', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'socialLinks'],
    include: [{ model: Location, as: 'homeLocation', attributes: LOCATION_FIELDS }],
    order: [['id', 'ASC']],
  });

  const creators = new Map();
  for (const member of members) {
    const link = member.socialLinks?.tiktok;
    const handle = typeof link === 'string' && getTikTokProfileHandle(link.replace(/^http:\/\//i, 'https://'));
    if (!handle || creators.has(handle)) continue;
    const nativeName = [member.firstNameNative, member.lastNameNative].filter(Boolean).join(' ');
    const englishName = [member.firstNameEn, member.lastNameEn].filter(Boolean).join(' ');
    creators.set(handle, {
      id: `member-${member.id}`,
      handle,
      displayName: nativeName || englishName || member.nickname || member.username,
      username: member.username,
      category: null,
      locationId: member.homeLocation?.id ?? null,
      location: member.homeLocation ?? null,
    });
  }
  return creators;
}

async function listCreators(query, { review = false, viewer = null } = {}) {
  const status = review ? query.status ?? 'pending' : 'approved';
  if (!STATUSES.includes(status)) throw createError('Invalid review status.', 400);
  const where = { status };
  if (query.category) {
    if (!TIKTOK_CREATOR_CATEGORIES.includes(query.category)) throw createError('Invalid creator category.', 400);
    where.category = query.category;
  }
  let locationIds;
  if (query.locationId) {
    const locationId = positiveId(query.locationId);
    if (!locationId) throw createError('Invalid location.', 400);
    locationIds = await getDescendantLocationIds(locationId, true);
  }
  const search = typeof query.q === 'string' ? query.q.trim().slice(0, 100).replace(/^@/, '').toLowerCase() : '';
  const members = review ? new Map() : await getMemberCreators(viewer);
  const matchingMembers = [...members.values()].filter(member => !search || (
    [member.handle, member.displayName, member.username].some(value => value?.toLowerCase().includes(search))
  ));
  if (locationIds) {
    const locations = new Set(locationIds);
    const memberHandlesInArea = [...members.values()].filter(member => locations.has(member.locationId)).map(member => member.handle);
    const areaMatches = [{ locationId: { [Op.in]: locationIds } }];
    if (memberHandlesInArea.length) areaMatches.push({ locationId: null, handle: { [Op.in]: memberHandlesInArea } });
    where[Op.and] = [{ [Op.or]: areaMatches }];
  }
  if (search) {
    const substring = sequelize.getDialect() === 'postgres' ? 'strpos' : 'instr';
    where[Op.or] = ['handle', 'displayName'].map((field) => (
      sqlWhere(fn(substring, fn('lower', col(`TikTokCreator.${field}`)), search), { [Op.gt]: 0 })
    ));
    if (matchingMembers.length) where[Op.or].push({ handle: { [Op.in]: matchingMembers.map(member => member.handle) } });
  }

  const page = positiveId(query.page) || 1;
  const offset = (page - 1) * PAGE_SIZE;
  const memberCandidates = query.category ? [] : matchingMembers.filter(member => !locationIds || locationIds.includes(member.locationId));
  const moderatedHandles = memberCandidates.length ? await TikTokCreator.findAll({
    where: { handle: { [Op.in]: memberCandidates.map(member => member.handle) }, status: { [Op.in]: ['approved', 'rejected'] } },
    attributes: ['handle'],
    raw: true,
  }) : [];
  const moderated = new Set(moderatedHandles.map(({ handle }) => handle));
  const memberListings = memberCandidates.filter(member => !moderated.has(member.handle));
  memberListings.sort((a, b) => a.handle.localeCompare(b.handle));
  // Member profiles come first, followed by the independently moderated directory entries.
  const memberPage = memberListings.slice(offset, offset + PAGE_SIZE);

  const { rows, count } = await TikTokCreator.findAndCountAll({
    where,
    attributes: ['id', 'handle', 'displayName', 'category', 'locationId', ...(review ? ['status'] : [])],
    include: [{ model: Location, as: 'location', attributes: LOCATION_FIELDS }],
    order: review && status === 'pending' ? [['id', 'ASC']] : [['handle', 'ASC']],
    limit: PAGE_SIZE - memberPage.length,
    offset: Math.max(0, offset - memberListings.length),
  });
  const listings = rows.map(row => {
    const member = members.get(row.handle);
    return member ? {
      ...row.toJSON(),
      username: member.username,
      locationId: row.locationId ?? member.locationId,
      location: row.location ?? member.location,
    } : row;
  });
  return { creators: [...memberPage, ...listings], totalPages: Math.ceil((count + memberListings.length) / PAGE_SIZE) };
}

async function submitCreator(input) {
  const handle = getTikTokProfileHandle(input.profile);
  if (!handle) throw createError('Enter a valid TikTok username or public profile URL.', 400);
  const category = input.category === '' ? null : input.category ?? null;
  if (category !== null && !TIKTOK_CREATOR_CATEGORIES.includes(category)) throw createError('Choose a valid creator category.', 400);
  const displayName = typeof input.displayName === 'string' ? input.displayName.trim() : '';
  if (displayName.length > 100) throw createError('The display name must be 100 characters or fewer.', 400);

  let locationId = null;
  if (input.locationId != null && input.locationId !== '') {
    locationId = positiveId(input.locationId);
    const location = locationId && await Location.findByPk(locationId, { attributes: ['type'] });
    if (!location || !TIKTOK_CREATOR_LOCATION_TYPES.includes(location.type)) throw createError('Choose a public area.', 400);
  }

  try {
    await TikTokCreator.create({ handle, displayName: displayName || null, category, locationId });
  } catch (error) {
    if (error instanceof UniqueConstraintError) throw createError('This TikTok profile has already been suggested.', 409);
    if (error instanceof ForeignKeyConstraintError) throw createError('Choose a public area.', 400);
    throw error;
  }
}

async function reviewCreator(id, { status, expectedStatus }, reviewerId) {
  if (!positiveId(id) || !['approved', 'rejected'].includes(status) || !STATUSES.includes(expectedStatus)) {
    throw createError('Invalid creator review.', 400);
  }
  const [updated] = await TikTokCreator.update({ status, reviewedByUserId: reviewerId, reviewedAt: new Date() }, {
    where: { id, status: expectedStatus },
  });
  if (!updated) throw createError('This listing changed. Refresh the review queue and try again.', 409);
}

module.exports = { listCreators, submitCreator, reviewCreator };
