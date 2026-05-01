/**
 * Expertise tag IDs for user and public person profiles.
 * Derived from src/data/expertiseTags.json (taxonomy v2).
 */

const expertiseTagsData = require('../data/expertiseTags.json');

const EXPERTISE_AREAS = expertiseTagsData.expertiseTags.map((t) => t.id);

module.exports = { EXPERTISE_AREAS };
