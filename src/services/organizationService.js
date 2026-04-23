'use strict';

const { Op } = require('sequelize');
const dbConfig = require('../config/database');
const { Organization } = require('../models');

const ORGANIZATION_TYPES = ['company', 'organization', 'institution', 'school', 'university', 'party'];

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

  while (true) {
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
};
