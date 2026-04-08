'use strict';

const { Tag, TaggableItem } = require('../models');
const { Op } = require('sequelize');

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 50;

/**
 * Normalise a raw tag name: lowercase, trim, max 50 chars.
 * Returns null if the result is empty.
 * @param {string} raw
 * @returns {string|null}
 */
function normalizeTagName(raw) {
  if (typeof raw !== 'string') return null;
  const s = raw.trim().toLowerCase().slice(0, MAX_TAG_LENGTH);
  return s || null;
}

/**
 * Given an entity and an array of tag name strings, sync its tags:
 *   1. Normalise names (lowercase/trim/max 50 chars), skip empty, cap at 20.
 *   2. Find-or-create each Tag by normalised name.
 *   3. Delete all existing TaggableItems for this (entityType, entityId).
 *   4. Bulk-create new TaggableItems.
 *
 * @param {string} entityType  - 'article' | 'poll' | 'suggestion'
 * @param {number} entityId
 * @param {string[]} tagNames  - raw tag strings from user input
 * @param {object} [transaction] - optional Sequelize transaction
 */
async function syncTags(entityType, entityId, tagNames, transaction) {
  const opts = transaction ? { transaction } : {};

  // Normalise and deduplicate
  const normalized = [];
  const seen = new Set();
  if (Array.isArray(tagNames)) {
    for (const raw of tagNames) {
      const name = normalizeTagName(raw);
      if (name && !seen.has(name)) {
        seen.add(name);
        normalized.push(name);
        if (normalized.length >= MAX_TAGS) break;
      }
    }
  }

  // Find-or-create each Tag
  const tagIds = [];
  for (const name of normalized) {
    const [tag] = await Tag.findOrCreate({ where: { name }, ...opts });
    tagIds.push(tag.id);
  }

  // Delete existing TaggableItems for this entity
  await TaggableItem.destroy({
    where: { entityType, entityId },
    ...opts
  });

  // Bulk-create new TaggableItems
  if (tagIds.length > 0) {
    await TaggableItem.bulkCreate(
      tagIds.map((tagId) => ({ tagId, entityType, entityId })),
      { ...opts, ignoreDuplicates: true }
    );
  }
}

/**
 * Attach a `tags` array (plain name strings) to one or more plain objects.
 * Queries TaggableItems + Tags for the given entityType + entityIds.
 *
 * @param {string} entityType - 'article' | 'poll' | 'suggestion'
 * @param {object|object[]} entities - a single plain object or array of plain objects with an `id` field
 * @returns {Promise<object|object[]>} same shape as input, each entity has `tags: string[]` added
 */
async function attachTags(entityType, entities) {
  const isArray = Array.isArray(entities);
  const arr = isArray ? entities : [entities];

  if (arr.length === 0) return entities;

  const ids = arr.map((e) => e.id);

  const items = await TaggableItem.findAll({
    where: { entityType, entityId: { [Op.in]: ids } },
    include: [{ model: Tag, as: 'tag', attributes: ['name'] }],
    raw: false
  });

  // Build map: entityId → [tagName, ...]
  const map = {};
  for (const item of items) {
    const id = item.entityId;
    if (!map[id]) map[id] = [];
    if (item.tag) map[id].push(item.tag.name);
  }

  const result = arr.map((entity) => ({
    ...entity,
    tags: map[entity.id] || []
  }));

  return isArray ? result : result[0];
}

module.exports = { syncTags, attachTags, normalizeTagName };
