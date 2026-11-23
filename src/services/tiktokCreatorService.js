const { Op, ForeignKeyConstraintError, UniqueConstraintError, col, fn, where: sqlWhere } = require('sequelize');
const { TikTokCreator, Location, sequelize } = require('../models');
const { createError } = require('../middleware/errorHandler');
const { getDescendantLocationIds } = require('../utils/locationUtils');
const { TIKTOK_CREATOR_CATEGORIES, TIKTOK_CREATOR_LOCATION_TYPES, getTikTokProfileHandle } = require('../../config/tiktokCreators');

const STATUSES = ['pending', 'approved', 'rejected'];
const PAGE_SIZE = 24;

function positiveId(value) {
  if (!['string', 'number'].includes(typeof value) || !/^\d+$/.test(String(value))) return null;
  const id = Number(value);
  return id > 0 && id <= 2147483647 ? id : null;
}

async function listCreators(query, review = false) {
  const status = review ? query.status ?? 'pending' : 'approved';
  if (!STATUSES.includes(status)) throw createError('Invalid review status.', 400);
  const where = { status };
  if (query.category) {
    if (!TIKTOK_CREATOR_CATEGORIES.includes(query.category)) throw createError('Invalid creator category.', 400);
    where.category = query.category;
  }
  if (query.locationId) {
    const locationId = positiveId(query.locationId);
    if (!locationId) throw createError('Invalid location.', 400);
    where.locationId = { [Op.in]: await getDescendantLocationIds(locationId, true) };
  }
  const search = typeof query.q === 'string' ? query.q.trim().slice(0, 100).replace(/^@/, '').toLowerCase() : '';
  if (search) {
    const substring = sequelize.getDialect() === 'postgres' ? 'strpos' : 'instr';
    where[Op.or] = ['handle', 'displayName'].map((field) => (
      sqlWhere(fn(substring, fn('lower', col(`TikTokCreator.${field}`)), search), { [Op.gt]: 0 })
    ));
  }

  const page = positiveId(query.page) || 1;
  const { rows, count } = await TikTokCreator.findAndCountAll({
    where,
    attributes: ['id', 'handle', 'displayName', 'category', 'locationId', ...(review ? ['status'] : [])],
    include: [{ model: Location, as: 'location', attributes: ['id', 'name', 'name_local', 'slug'] }],
    order: review && status === 'pending' ? [['id', 'ASC']] : [['handle', 'ASC']],
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  return { creators: rows, totalPages: Math.ceil(count / PAGE_SIZE) };
}

async function submitCreator(input) {
  const handle = getTikTokProfileHandle(input.profile);
  if (!handle) throw createError('Enter a valid TikTok username or public profile URL.', 400);
  if (!TIKTOK_CREATOR_CATEGORIES.includes(input.category)) throw createError('Choose a creator category.', 400);
  const displayName = typeof input.displayName === 'string' ? input.displayName.trim() : '';
  if (displayName.length > 100) throw createError('The display name must be 100 characters or fewer.', 400);

  const locationId = positiveId(input.locationId);
  const location = locationId && await Location.findByPk(locationId, { attributes: ['type'] });
  if (!location || !TIKTOK_CREATOR_LOCATION_TYPES.includes(location.type)) throw createError('Choose a public area.', 400);

  try {
    await TikTokCreator.create({ handle, displayName: displayName || null, category: input.category, locationId });
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
