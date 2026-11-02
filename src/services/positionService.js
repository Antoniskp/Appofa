'use strict';

const { Op, literal } = require('sequelize');
const { createHash } = require('crypto');
const {
  sequelize, Organization, OrganizationMember, PolicyCategory, OrganizationPosition,
  PositionRevision, PositionSource, PositionTopic, PositionVote, Topic,
} = require('../models');
const { isOrgAdmin, isActiveMember } = require('../utils/organizationUtils');

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}
function id(value) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) fail(400, 'Invalid identifier.');
  return parsed;
}
const staff = user => !!user && ['admin', 'moderator'].includes(user.role);
async function access(organizationId, user, manage = false, transaction) {
  const organization = await Organization.findByPk(id(organizationId), { transaction });
  if (!organization) fail(404, 'Organization not found.');
  const canManage = !!user && await isOrgAdmin(organization.id, user.id, user.role);
  if (!organization.isPublic && !canManage && !await isActiveMember(organization.id, user?.id)) fail(404, 'Organization not found.');
  if (manage && !canManage) fail(403, 'Organization management permission required.');
  const canPublishOfficial = !!user && !!await OrganizationMember.findOne({
    where: { organizationId: organization.id, userId: user.id, status: 'active', role: { [Op.in]: ['owner', 'admin'] } },
    transaction,
  });
  return { organization, canManage, canPublishOfficial, canReview: canManage };
}
function requiredText(value, max, min = 1) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) fail(400, 'Invalid text length.');
  return value.trim();
}
function url(value, optional = false) {
  if (!value && optional) return null;
  if (typeof value !== 'string' || value.length > 2048) fail(400, 'A valid source URL is required.');
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
    return parsed.href;
  } catch { fail(400, 'Source links must use http or https.'); }
}
function sourceDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) fail(400, 'Invalid source publication date.');
  return date;
}
function content(input, permissions) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'Provide a position object.');
  const attribution = input.attribution || 'sourced';
  if (!['official', 'sourced', 'community'].includes(attribution)) fail(400, 'Invalid attribution.');
  if (attribution === 'official' && !permissions.canPublishOfficial) fail(403, 'Only organization representatives can author official positions.');
  if (!Array.isArray(input.sources) || input.sources.length > 10) fail(400, 'Provide up to ten sources.');
  const title = requiredText(input.title, 200, 5);
  const body = requiredText(input.body, 20000);
  const sources = input.sources.map(source => {
    if (!source || typeof source !== 'object' || Array.isArray(source)) fail(400, 'Invalid source.');
    const sourceUrl = url(source.sourceUrl);
    const originalSourceUrl = url(source.originalSourceUrl, true);
    return {
      provider: requiredText(source.provider || 'website', 80),
      sourceUrl, originalSourceUrl,
      externalId: source.externalId ? requiredText(source.externalId, 255) : null,
      originalTopic: source.originalTopic ? requiredText(source.originalTopic, 255) : null,
      sourcePublishedAt: sourceDate(source.sourcePublishedAt),
      retrievedAt: new Date(),
      contentFingerprint: createHash('sha256').update(JSON.stringify([sourceUrl, originalSourceUrl, title, body])).digest('hex'),
      reviewStatus: 'pending',
    };
  });
  if (attribution !== 'community' && !sources.length) fail(400, 'Sourced and official positions require a source.');
  return { title, body, attribution, sources };
}
async function classification(input, transaction) {
  const categoryId = id(input.categoryId);
  if (!await PolicyCategory.findByPk(categoryId, { transaction })) fail(400, 'Unknown category.');
  if (!Array.isArray(input.topicIds) || input.topicIds.length > 20) fail(400, 'Provide up to twenty topics.');
  const topicIds = [...new Set(input.topicIds.map(id))];
  if (await Topic.count({ where: { id: topicIds, status: 'active' }, transaction }) !== topicIds.length) fail(400, 'Unknown or inactive topic.');
  return { categoryId, topicIds };
}
async function saveSources(revisionId, sources, transaction) {
  await PositionSource.destroy({ where: { revisionId }, transaction });
  if (sources.length) await PositionSource.bulkCreate(sources.map(source => ({ ...source, revisionId })), { transaction, validate: true });
}
async function metadata(organizationId, user) {
  const permissions = organizationId ? await access(organizationId, user) : {};
  const [categories, topics, organizations] = await Promise.all([
    PolicyCategory.findAll({ order: [['name', 'ASC']] }),
    Topic.findAll({ where: { status: 'active' }, attributes: ['id', 'name', 'slug'], order: [['name', 'ASC']] }),
    organizationId ? [] : Organization.findAll({ where: { isPublic: true }, attributes: ['id', 'name', 'slug', 'type', 'logo'], order: [['name', 'ASC']] }),
  ]);
  return { categories, topics, organizations, canManage: !!permissions.canManage, canPublishOfficial: !!permissions.canPublishOfficial };
}

// Fixed SQL expressions only: user input is passed through Sequelize's where clauses.
const supportSql = '(SELECT COUNT(*) FROM "PositionVotes" pv WHERE pv."revisionId" = "PositionRevision"."id" AND pv."value" = 1)';
const opposeSql = '(SELECT COUNT(*) FROM "PositionVotes" pv WHERE pv."revisionId" = "PositionRevision"."id" AND pv."value" = -1)';
const totalSql = '(' + supportSql + ' + ' + opposeSql + ')';
const proportionSql = '(1.0 * ' + supportSql + ' / NULLIF(' + totalSql + ', 0))';
const topSql = 'COALESCE((' + proportionSql + ' + 1.9208 / NULLIF(' + totalSql + ', 0) - 1.96 * SQRT((' + proportionSql + ' * (1 - ' + proportionSql + ') + 0.9604 / NULLIF(' + totalSql + ', 0)) / NULLIF(' + totalSql + ', 0))) / (1 + 3.8416 / NULLIF(' + totalSql + ', 0)), 0)';

async function summary(organizationId, user) {
  await access(organizationId, user);
  const [rows] = await sequelize.query(`
    SELECT COUNT(DISTINCT p.id) AS positions, COUNT(CASE WHEN v.value = 1 THEN 1 END) AS support,
           COUNT(CASE WHEN v.value = -1 THEN 1 END) AS oppose
    FROM "OrganizationPositions" p JOIN "PositionRevisions" r ON r."positionId" = p.id AND r.status = 'published'
    LEFT JOIN "PositionVotes" v ON v."revisionId" = r.id
    WHERE p."organizationId" = :organizationId AND p.status = 'active'`, { replacements: { organizationId: id(organizationId) } });
  return Object.fromEntries(Object.entries(rows[0]).map(([key, value]) => [key, Number(value)]));
}

async function detail(positionId, user) {
  const position = await OrganizationPosition.findByPk(id(positionId));
  if (!position) fail(404, 'Position not found.');
  const result = await list({ organizationId: position.organizationId, positionId }, user);
  if (!result.positions.length) fail(404, 'Position not found.');
  return result.positions[0];
}

async function list(query, user) {
  const organizationId = query.organizationId ? id(query.organizationId) : null;
  const manage = query.manage === 'true';
  if (manage && !organizationId) fail(400, 'Select an organization to manage.');
  if (organizationId) await access(organizationId, user, manage);
  const positionWhere = manage ? {} : { status: 'active' };
  if (query.positionId) positionWhere.id = id(query.positionId);
  if (organizationId) positionWhere.organizationId = organizationId;
  if (query.categoryId) positionWhere.categoryId = id(query.categoryId);
  const revisionWhere = { status: manage ? { [Op.in]: ['draft', 'in_review', 'rejected', 'published'] } : 'published' };
  if (!manage && user && query.voteView && query.voteView !== 'all') {
    if (!['unanswered', 'agree', 'disagree'].includes(query.voteView)) fail(400, 'Invalid vote view.');
    const valueClause = query.voteView === 'unanswered' ? '' : query.voteView === 'agree' ? ' AND pv.value = 1' : ' AND pv.value = -1';
    const exists = query.voteView === 'unanswered' ? 'NOT EXISTS' : 'EXISTS';
    revisionWhere[Op.and] = literal(`${exists} (SELECT 1 FROM "PositionVotes" pv WHERE pv."revisionId" = "PositionRevision"."id" AND pv."userId" = ${sequelize.escape(user.id)}${valueClause})`);
  }
  if (query.search) {
    const search = requiredText(query.search, 200);
    // POSITION/INSTR performs a literal substring match, including % and _.
    const needle = sequelize.fn('LOWER', search);
    const contains = column => sequelize.where(
      sequelize.fn('instr', sequelize.fn('LOWER', sequelize.col(column)), needle),
      { [Op.gt]: 0 },
    );
    const match = column => sequelize.getDialect() === 'postgres'
      ? sequelize.where(sequelize.fn('strpos', sequelize.fn('LOWER', sequelize.col(column)), needle), { [Op.gt]: 0 })
      : contains(column);
    revisionWhere[Op.or] = [match('PositionRevision.title'), match('PositionRevision.body')];
  }
  const page = Math.max(1, Math.min(100000, parseInt(query.page, 10) || 1));
  const limit = 12;
  const include = [{
    model: OrganizationPosition, as: 'position', required: true, where: positionWhere,
    include: [
      { model: Organization, as: 'organization', required: true, attributes: ['id', 'name', 'slug', 'type', 'logo'],
        where: organizationId ? {} : { isPublic: true } },
      { model: PolicyCategory, as: 'category' },
      { model: Topic, as: 'topics', through: { attributes: [] }, attributes: ['id', 'name', 'slug'],
        ...(query.topicId ? { where: { id: id(query.topicId) }, required: true } : {}) },
    ],
  }];
  const orderSql = { top: topSql, support: supportSql, approval: 'CASE WHEN ' + totalSql + ' >= 10 THEN ' + proportionSql + ' ELSE -1 END', divisive: 'CASE WHEN ' + totalSql + ' >= 10 THEN 1 - ABS(2 * ' + proportionSql + ' - 1) ELSE -1 END' };
  const sort = query.sort || 'top';
  if (!['top', 'support', 'approval', 'divisive', 'newest'].includes(sort)) fail(400, 'Invalid sort.');
  const order = sort === 'newest' || manage ? [['createdAt', 'DESC'], ['id', 'DESC']] : [[literal(orderSql[sort]), 'DESC'], [literal(totalSql), 'DESC'], ['id', 'DESC']];
  // A required many-to-many topic join needs subQuery:false. Fetch distinct IDs first
  // to avoid pagination counting duplicate topic rows.
  const count = await PositionRevision.count({ where: revisionWhere, include, distinct: true, col: 'id' });
  const ids = await PositionRevision.findAll({
    attributes: ['id'], where: revisionWhere,
    include: include.map(item => ({ ...item, attributes: [], include: item.include.map(child => ({ ...child, attributes: [], ...(child.through ? { through: { attributes: [] } } : {}) })) })),
    group: ['PositionRevision.id'], order, limit, offset: (page - 1) * limit, subQuery: false,
  });
  const revisionIds = ids.map(row => row.id);
  const rows = revisionIds.length ? await PositionRevision.findAll({
    where: { id: revisionIds },
    attributes: ['id', 'positionId', 'version', 'title', 'body', 'attribution', 'status', 'publishedAt', 'createdAt', ...(manage ? ['reviewNote'] : []),
      [literal(supportSql), 'support'], [literal(opposeSql), 'oppose']],
    include: [...include, { model: PositionSource, as: 'sources', attributes: ['id', 'provider', 'sourceUrl', 'originalSourceUrl', 'sourcePublishedAt', 'retrievedAt', 'externalId', 'originalTopic', 'reviewStatus'] }],
  }) : [];
  const ownVotes = user && revisionIds.length ? await PositionVote.findAll({ where: { revisionId: revisionIds, userId: user.id }, attributes: ['revisionId', 'value'] }) : [];
  const votes = new Map(ownVotes.map(vote => [vote.revisionId, vote.value]));
  const byId = new Map(rows.map(row => {
    const data = row.toJSON();
    data.support = Number(data.support);
    data.oppose = Number(data.oppose);
    data.myVote = votes.get(data.id) || 0;
    return [data.id, data];
  }));
  let allAnswered = false;
  if (!count && user && !manage && query.voteView === 'unanswered' &&
      !organizationId && !query.topicId && !query.categoryId && !query.search && !query.positionId) {
    allAnswered = Boolean(await PositionRevision.findOne({
      attributes: ['id'], where: { status: 'published' }, include, subQuery: false,
    }));
  }
  return { allAnswered, positions: revisionIds.map(revisionId => byId.get(revisionId)), pagination: { page, pages: Math.ceil(count / limit), total: count } };
}

async function create(organizationId, input, user) {
  const permissions = await access(organizationId, user, true);
  const draft = content(input, permissions);
  return sequelize.transaction(async transaction => {
    const { categoryId, topicIds } = await classification(input, transaction);
    const position = await OrganizationPosition.create({ organizationId: id(organizationId), categoryId, createdByUserId: user.id }, { transaction });
    await PositionTopic.bulkCreate(topicIds.map(topicId => ({ positionId: position.id, topicId })), { transaction });
    const revision = await PositionRevision.create({ positionId: position.id, version: 1, title: draft.title, body: draft.body, attribution: draft.attribution, createdByUserId: user.id }, { transaction });
    await saveSources(revision.id, draft.sources, transaction);
    return { positionId: position.id, revisionId: revision.id };
  });
}
async function lockedPosition(positionId, user, transaction, manage = true) {
  const position = await OrganizationPosition.findByPk(id(positionId), { transaction, lock: transaction.LOCK.UPDATE });
  if (!position) fail(404, 'Position not found.');
  const permissions = await access(position.organizationId, user, manage, transaction);
  return { position, permissions };
}
async function revise(positionId, input, user) {
  return sequelize.transaction(async transaction => {
    const { position, permissions } = await lockedPosition(positionId, user, transaction);
    const draft = content(input, permissions);
    const version = (await PositionRevision.max('version', { where: { positionId: position.id }, transaction })) + 1;
    const revision = await PositionRevision.create({ positionId: position.id, version, title: draft.title, body: draft.body, attribution: draft.attribution, createdByUserId: user.id }, { transaction });
    await saveSources(revision.id, draft.sources, transaction);
    return { positionId: position.id, revisionId: revision.id };
  });
}
async function mutateRevision(revisionId, input, user, action) {
  const existing = await PositionRevision.findByPk(id(revisionId), { attributes: ['positionId'] });
  if (!existing) fail(404, 'Revision not found.');
  return sequelize.transaction(async transaction => {
    const { position, permissions } = await lockedPosition(existing.positionId, user, transaction);
    const revision = await PositionRevision.findByPk(id(revisionId), { transaction, lock: transaction.LOCK.UPDATE });
    if (!['draft', 'in_review', 'rejected'].includes(revision.status)) fail(409, 'Published versions cannot be edited. Create a new version.');
    if (action === 'save') {
      const draft = content(input, permissions);
      await revision.update({ title: draft.title, body: draft.body, attribution: draft.attribution, status: 'draft', reviewedByUserId: null, reviewedAt: null, reviewNote: null }, { transaction });
      await saveSources(revision.id, draft.sources, transaction);
    } else if (action === 'publish') {
      if (position.status !== 'active') fail(409, 'Reactivate the position before publishing.');
      if (revision.attribution === 'official' && !permissions.canPublishOfficial) fail(403, 'An organization representative must publish official positions.');
      const sources = await PositionSource.findAll({ where: { revisionId: revision.id }, transaction });
      if (revision.attribution !== 'community' && !sources.length) fail(400, 'A source is required.');
      if (input.sourcesVerified !== true) fail(400, 'Confirm that you checked the position and its sources.');
      await PositionRevision.update({ status: 'superseded' }, { where: { positionId: position.id, status: 'published' }, transaction });
      await PositionSource.update({ reviewStatus: 'verified' }, { where: { revisionId: revision.id }, transaction });
      await revision.update({ status: 'published', reviewedByUserId: user.id, reviewedAt: new Date(), publishedAt: new Date(), reviewNote: null }, { transaction });
    } else {
      await revision.update({ status: 'rejected', reviewedByUserId: user.id, reviewedAt: new Date(), reviewNote: requiredText(input.reviewNote, 2000) }, { transaction });
    }
    return { revisionId: revision.id };
  });
}
async function changeStatus(positionId, status, user) {
  if (!['active', 'withdrawn', 'archived'].includes(status)) fail(400, 'Invalid position status.');
  return sequelize.transaction(async transaction => {
    const { position } = await lockedPosition(positionId, user, transaction);
    await position.update({ status }, { transaction });
    return { status };
  });
}
async function vote(revisionId, value, user) {
  if (![0, 1, -1].includes(value)) fail(400, 'Vote must be support, oppose, or removed.');
  const existing = await PositionRevision.findByPk(id(revisionId), { attributes: ['positionId'] });
  if (!existing) fail(404, 'Revision not found.');
  return sequelize.transaction(async transaction => {
    const { position } = await lockedPosition(existing.positionId, user, transaction, false);
    const revision = await PositionRevision.findByPk(id(revisionId), { transaction });
    if (position.status !== 'active' || revision.status !== 'published') fail(409, 'Voting is only available on the current published position.');
    const where = { revisionId: revision.id, userId: user.id };
    if (value === 0) await PositionVote.destroy({ where, transaction });
    else await PositionVote.upsert({ ...where, value, identityVisibility: 'anonymous' }, { transaction });
    const support = await PositionVote.count({ where: { revisionId: revision.id, value: 1 }, transaction });
    const oppose = await PositionVote.count({ where: { revisionId: revision.id, value: -1 }, transaction });
    return { value, support, oppose };
  });
}
async function history(positionId, user) {
  const position = await OrganizationPosition.findByPk(id(positionId));
  if (!position) fail(404, 'Position not found.');
  await access(position.organizationId, user);
  return PositionRevision.findAll({
    where: { positionId: position.id, status: { [Op.in]: ['published', 'superseded'] } },
    attributes: ['id', 'version', 'title', 'body', 'status', 'publishedAt', [literal(supportSql), 'support'], [literal(opposeSql), 'oppose']],
    include: [{ model: PositionSource, as: 'sources', attributes: ['provider', 'sourceUrl', 'originalSourceUrl', 'sourcePublishedAt'] }],
    order: [['version', 'DESC']],
  });
}
async function createCategory(input, user) {
  if (!staff(user)) fail(403, 'Platform moderation permission required.');
  const name = requiredText(input.name, 120);
  const slug = requiredText(input.slug, 140);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail(400, 'Use a lowercase URL slug.');
  return PolicyCategory.create({ name, slug });
}

module.exports = { access, metadata, list, summary, detail, create, revise, mutateRevision, changeStatus, vote, history, createCategory };
