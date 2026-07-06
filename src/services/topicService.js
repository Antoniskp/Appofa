'use strict';

const { Op } = require('sequelize');
const { Tag, TaggableItem, Topic, TopicExternalLink, sequelize } = require('../models');
const { slugifyTopic } = require('../utils/topicUtils');
const { normalizePublicHttpUrl } = require('../utils/validators');

const ENTITY_TYPES = ['article', 'poll', 'suggestion'];
const TOPIC_STATUSES = ['active', 'hidden', 'merged'];
const LINK_STATUSES = ['approved', 'pending', 'rejected'];
const LINK_PROVIDERS = ['youtube', 'tiktok', 'x', 'twitter', 'website'];
const LINK_SOURCE_TYPES = ['video', 'post', 'article', 'official', 'dataset', 'link'];

function normalizeAliases(value) {
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  const aliases = [];
  const seen = new Set();
  for (const item of raw) {
    const alias = String(item || '').trim().replace(/\s+/g, ' ').slice(0, 100);
    const key = alias.toLowerCase();
    if (alias && !seen.has(key)) {
      seen.add(key);
      aliases.push(alias);
    }
  }
  return aliases.slice(0, 20);
}

function detectProvider(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === 'youtu.be' || host.endsWith('youtube.com')) return 'youtube';
    if (host.endsWith('tiktok.com')) return 'tiktok';
    if (host === 'x.com' || host.endsWith('.x.com')) return 'x';
    if (host === 'twitter.com' || host.endsWith('.twitter.com')) return 'twitter';
  } catch {
    return 'website';
  }
  return 'website';
}

function plain(instance) {
  return instance?.toJSON ? instance.toJSON() : instance;
}

async function getCountsForTagIds(tagIds) {
  const result = {};
  tagIds.forEach((id) => {
    result[id] = { article: 0, poll: 0, suggestion: 0 };
  });

  if (!tagIds.length) return result;

  const rows = await TaggableItem.findAll({
    where: { tagId: { [Op.in]: tagIds } },
    attributes: [
      'tagId',
      'entityType',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['tagId', 'entityType'],
    raw: true
  });

  rows.forEach((row) => {
    if (!result[row.tagId]) result[row.tagId] = { article: 0, poll: 0, suggestion: 0 };
    if (ENTITY_TYPES.includes(row.entityType)) {
      result[row.tagId][row.entityType] = parseInt(row.count, 10) || 0;
    }
  });

  return result;
}

function totalCounts(counts) {
  return (counts.article || 0) + (counts.poll || 0) + (counts.suggestion || 0);
}

function topicDto(topic, counts = {}, links = []) {
  const data = plain(topic);
  const tag = data.tag || null;
  const resolvedCounts = counts || { article: 0, poll: 0, suggestion: 0 };
  return {
    id: data.id,
    tagId: data.tagId,
    name: data.name,
    slug: data.slug,
    description: data.description || '',
    aliases: Array.isArray(data.aliases) ? data.aliases : [],
    heroImageUrl: data.heroImageUrl || '',
    status: data.status,
    isFeatured: Boolean(data.isFeatured),
    tagName: tag?.name || data.name,
    count: totalCounts(resolvedCounts),
    counts: resolvedCounts,
    externalLinks: links.map((link) => plain(link))
  };
}

function fallbackTopicDto(tag, counts = {}) {
  const data = plain(tag);
  const resolvedCounts = counts || { article: 0, poll: 0, suggestion: 0 };
  return {
    id: null,
    tagId: data.id,
    name: data.name,
    slug: slugifyTopic(data.name),
    description: '',
    aliases: [],
    heroImageUrl: '',
    status: 'active',
    isFeatured: false,
    tagName: data.name,
    count: totalCounts(resolvedCounts),
    counts: resolvedCounts,
    externalLinks: []
  };
}

async function listTopics({ includeHidden = false, q = '', limit = 100 } = {}) {
  const parsedLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
  const term = String(q || '').trim().toLowerCase();
  const searchOperator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;

  const topicWhere = {};
  if (!includeHidden) topicWhere.status = 'active';
  if (term) {
    topicWhere[Op.or] = [
      { name: { [searchOperator]: `%${term}%` } },
      { slug: { [searchOperator]: `%${slugifyTopic(term)}%` } }
    ];
  }

  const topics = await Topic.findAll({
    where: topicWhere,
    include: [
      { model: Tag, as: 'tag', required: false, attributes: ['id', 'name'] },
      {
        model: TopicExternalLink,
        as: 'externalLinks',
        required: false,
        where: includeHidden ? undefined : { status: 'approved' },
        separate: true,
        order: [['order', 'ASC'], ['createdAt', 'DESC']]
      }
    ],
    order: [['isFeatured', 'DESC'], ['name', 'ASC']]
  });

  const topicTagIds = topics.map((topic) => topic.tagId).filter(Boolean);
  const countsByTagId = await getCountsForTagIds(topicTagIds);
  const curated = topics.map((topic) => topicDto(
    topic,
    topic.tagId ? countsByTagId[topic.tagId] : undefined,
    topic.externalLinks || []
  ));

  const usedTagIds = new Set(topicTagIds);
  const usedSlugs = new Set(curated.map((topic) => topic.slug));
  const tagWhere = {};
  if (term) {
    tagWhere.name = { [searchOperator]: `%${term}%` };
  }

  const tags = await Tag.findAll({
    where: tagWhere,
    include: [{ model: TaggableItem, as: 'taggableItems', required: true, attributes: ['id'] }],
    order: [['name', 'ASC']]
  });
  const fallbackTagIds = tags.map((tag) => tag.id).filter((id) => !usedTagIds.has(id));
  const fallbackCountsByTagId = await getCountsForTagIds(fallbackTagIds);
  const fallback = tags
    .filter((tag) => !usedTagIds.has(tag.id) && !usedSlugs.has(slugifyTopic(tag.name)))
    .map((tag) => fallbackTopicDto(tag, fallbackCountsByTagId[tag.id]))
    .filter((topic) => topic.count > 0);

  return [...curated, ...fallback]
    .filter((topic) => includeHidden || topic.status === 'active')
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, parsedLimit);
}

async function getTopicBySlug(slug, { includeHidden = false } = {}) {
  const normalizedSlug = slugifyTopic(decodeURIComponent(String(slug || '')));
  if (!normalizedSlug) return null;

  const topic = await Topic.findOne({
    where: {
      slug: normalizedSlug,
      ...(includeHidden ? {} : { status: 'active' })
    },
    include: [
      { model: Tag, as: 'tag', required: false, attributes: ['id', 'name'] },
      {
        model: TopicExternalLink,
        as: 'externalLinks',
        required: false,
        where: includeHidden ? undefined : { status: 'approved' },
        separate: true,
        order: [['order', 'ASC'], ['createdAt', 'DESC']]
      }
    ]
  });

  if (topic) {
    const countsByTagId = topic.tagId ? await getCountsForTagIds([topic.tagId]) : {};
    return topicDto(topic, topic.tagId ? countsByTagId[topic.tagId] : undefined, topic.externalLinks || []);
  }

  const tags = await Tag.findAll({ order: [['name', 'ASC']] });
  const tag = tags.find((item) => slugifyTopic(item.name) === normalizedSlug);
  if (!tag) return null;
  const countsByTagId = await getCountsForTagIds([tag.id]);
  const fallback = fallbackTopicDto(tag, countsByTagId[tag.id]);
  return fallback.count > 0 ? fallback : null;
}

async function findOrCreateTagForTopic(name, transaction) {
  const tagName = String(name || '').trim().toLowerCase();
  if (!tagName) return null;
  const [tag] = await Tag.findOrCreate({ where: { name: tagName }, transaction });
  return tag;
}

function normalizeTopicPayload(payload) {
  const name = String(payload.name || '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 120) {
    return { error: 'Topic name must be between 2 and 120 characters.' };
  }

  const slug = slugifyTopic(payload.slug || name);
  if (!slug) return { error: 'Topic slug is required.' };

  const status = payload.status || 'active';
  if (!TOPIC_STATUSES.includes(status)) return { error: 'Invalid topic status.' };

  const heroImageResult = normalizePublicHttpUrl(payload.heroImageUrl, 'Hero image URL', true);
  if (heroImageResult.error) return { error: heroImageResult.error };

  return {
    value: {
      name,
      slug,
      description: payload.description ? String(payload.description).trim().slice(0, 2000) : null,
      aliases: normalizeAliases(payload.aliases),
      heroImageUrl: heroImageResult.value || null,
      status,
      isFeatured: Boolean(payload.isFeatured)
    }
  };
}

function normalizeExternalLink(raw, index, userId) {
  const urlResult = normalizePublicHttpUrl(raw.url, `External link ${index + 1} URL`, false);
  if (urlResult.error) return { error: urlResult.error };

  const provider = LINK_PROVIDERS.includes(raw.provider) ? raw.provider : detectProvider(urlResult.value);
  const status = LINK_STATUSES.includes(raw.status) ? raw.status : 'approved';
  const sourceType = LINK_SOURCE_TYPES.includes(raw.sourceType) ? raw.sourceType : (provider === 'youtube' || provider === 'tiktok' ? 'video' : 'link');

  return {
    value: {
      url: urlResult.value,
      provider,
      sourceType,
      title: raw.title ? String(raw.title).trim().slice(0, 500) : null,
      description: raw.description ? String(raw.description).trim().slice(0, 1000) : null,
      thumbnailUrl: raw.thumbnailUrl ? String(raw.thumbnailUrl).trim().slice(0, 2048) : null,
      embedUrl: raw.embedUrl ? String(raw.embedUrl).trim().slice(0, 2048) : null,
      embedHtml: raw.embedHtml ? String(raw.embedHtml).trim().slice(0, 65535) : null,
      status,
      submittedByUserId: raw.submittedByUserId || userId || null,
      order: Number.isInteger(Number(raw.order)) ? Number(raw.order) : index
    }
  };
}

async function syncExternalLinks(topicId, links, userId, transaction) {
  if (!Array.isArray(links)) return;
  const normalized = [];
  for (let i = 0; i < links.length; i += 1) {
    const result = normalizeExternalLink(links[i], i, userId);
    if (result.error) {
      throw Object.assign(new Error(result.error), { status: 400 });
    }
    normalized.push(result.value);
  }

  await TopicExternalLink.destroy({ where: { topicId }, transaction });
  if (normalized.length) {
    await TopicExternalLink.bulkCreate(
      normalized.map((link) => ({ ...link, topicId })),
      { transaction }
    );
  }
}

async function createTopic(payload, userId) {
  const normalized = normalizeTopicPayload(payload);
  if (normalized.error) return { success: false, status: 400, message: normalized.error };

  const transaction = await sequelize.transaction();
  try {
    const tag = await findOrCreateTagForTopic(payload.tagName || normalized.value.name, transaction);
    const topic = await Topic.create({
      ...normalized.value,
      tagId: tag?.id || null,
      createdByUserId: userId,
      updatedByUserId: userId
    }, { transaction });

    await syncExternalLinks(topic.id, payload.externalLinks || [], userId, transaction);
    await transaction.commit();
    return { success: true, data: await getTopicBySlug(topic.slug, { includeHidden: true }) };
  } catch (error) {
    await transaction.rollback();
    if (error.name === 'SequelizeUniqueConstraintError') {
      return { success: false, status: 409, message: 'A topic with this slug or tag already exists.' };
    }
    console.error('createTopic error:', error);
    return { success: false, status: error.status || 500, message: error.message || 'Failed to create topic.' };
  }
}

async function updateTopic(id, payload, userId) {
  const topic = await Topic.findByPk(id);
  if (!topic) return { success: false, status: 404, message: 'Topic not found.' };

  const normalized = normalizeTopicPayload({ ...topic.toJSON(), ...payload });
  if (normalized.error) return { success: false, status: 400, message: normalized.error };

  const transaction = await sequelize.transaction();
  try {
    let tagId = topic.tagId;
    if (payload.tagName !== undefined) {
      const tag = await findOrCreateTagForTopic(payload.tagName || normalized.value.name, transaction);
      tagId = tag?.id || null;
    }

    await topic.update({
      ...normalized.value,
      tagId,
      updatedByUserId: userId
    }, { transaction });

    if (payload.externalLinks !== undefined) {
      await syncExternalLinks(topic.id, payload.externalLinks, userId, transaction);
    }

    await transaction.commit();
    return { success: true, data: await getTopicBySlug(topic.slug, { includeHidden: true }) };
  } catch (error) {
    await transaction.rollback();
    if (error.name === 'SequelizeUniqueConstraintError') {
      return { success: false, status: 409, message: 'A topic with this slug or tag already exists.' };
    }
    console.error('updateTopic error:', error);
    return { success: false, status: error.status || 500, message: error.message || 'Failed to update topic.' };
  }
}

module.exports = {
  listTopics,
  getTopicBySlug,
  createTopic,
  updateTopic
};
