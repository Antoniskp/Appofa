'use strict';

const path = require('path');
const dbConfig = require('../config/database');
const { Op } = require('sequelize');
const { Organization, OrganizationMember, OrganizationAnalytics, Poll, Suggestion } = require('../models');

const { types: ORGANIZATION_TYPES } = require(path.resolve(__dirname, '../../config/organizationTypes.json'));

function slugifyName(name) {
  const base = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return base || 'organization';
}

async function generateSlug(name, excludeId = null) {
  const base = slugifyName(name);
  let counter = 1;

  while (counter <= 1000) {
    const candidate = counter === 1 ? base : `${base}-${counter}`;
    const where = { slug: candidate };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const exists = await Organization.findOne({ where, attributes: ['id'] });
    if (!exists) {
      return candidate;
    }

    counter += 1;
  }

  throw new Error('Failed to generate unique organization slug.');
}

function buildSearchWhere(search) {
  if (!search || typeof search !== 'string') return {};
  const cleanSearch = search.trim();
  if (!cleanSearch) return {};

  const likeOp = dbConfig.getDialect() === 'postgres' ? Op.iLike : Op.like;
  const escaped = cleanSearch.replace(/[%_\\]/g, '\\$&');

  return {
    [Op.or]: [
      { name: { [likeOp]: `%${escaped}%` } },
      { description: { [likeOp]: `%${escaped}%` } },
    ],
  };
}

module.exports = {
  ORGANIZATION_TYPES,
  generateSlug,
  buildSearchWhere,
  recordAnalyticsSnapshot: async (organizationId) => {
    const [
      memberCount,
      activeMemberCount,
      pollCount,
      suggestionCount,
      officialPollCount,
      officialSuggestionCount,
    ] = await Promise.all([
      OrganizationMember.count({ where: { organizationId } }),
      OrganizationMember.count({ where: { organizationId, status: 'active' } }),
      Poll.count({ where: { organizationId } }),
      Suggestion.count({ where: { organizationId } }),
      Poll.count({ where: { organizationId, isOfficialPost: true } }),
      Suggestion.count({ where: { organizationId, isOfficialPost: true } }),
    ]);

    const date = new Date().toISOString().slice(0, 10);
    const [snapshot] = await OrganizationAnalytics.findOrCreate({
      where: { organizationId, date },
      defaults: { organizationId, date },
    });

    await snapshot.update({
      memberCount,
      activeMemberCount,
      pollCount,
      suggestionCount,
      officialPostCount: officialPollCount + officialSuggestionCount,
    });

    return snapshot;
  },
};
