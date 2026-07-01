const crypto = require('crypto');
const { Op } = require('sequelize');
const {
  NewsletterSubscriber,
  NewsletterCampaign,
  NewsletterSendLog,
  User,
} = require('../models');
const {
  normalizeRequiredText,
  normalizeEmail,
  normalizeOptionalText,
  normalizeEnum,
  normalizeStringArray,
} = require('../utils/validators');
const { sendMail: deliverMail } = require('./mailService');

const SUBSCRIBER_STATUSES = ['pending', 'subscribed', 'unsubscribed'];
const SUBSCRIBER_SOURCES = ['website', 'admin_manual', 'import'];
const CAMPAIGN_STATUSES = ['draft', 'scheduled', 'sending', 'sent', 'failed'];
const SEND_LOG_STATUSES = ['queued', 'sent', 'failed'];
const NEWSLETTER_GENERIC_SUBSCRIBE_MESSAGE = 'If this email can receive newsletter updates, it has been added or updated.';
const NEWSLETTER_GENERIC_UNSUBSCRIBE_MESSAGE = 'If this unsubscribe link is valid, the email has been unsubscribed.';
class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ServiceError';
  }
}

const normalizeLocale = (value) => {
  const localeResult = normalizeOptionalText(value, 'Locale', 2, 10);
  if (localeResult.error) return localeResult;
  if (!localeResult.value) return { value: localeResult.value };
  return { value: localeResult.value.toLowerCase() };
};

const normalizeTags = (value) => {
  if (value === undefined) return { value: undefined };
  if (typeof value === 'string') {
    const parsed = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return normalizeStringArray(parsed, 'Tags');
  }
  return normalizeStringArray(value, 'Tags');
};

const normalizeDateInput = (value, fieldLabel) => {
  if (value === undefined) return { value: undefined };
  if (value === null || value === '') return { value: null };
  if (value instanceof Date && !Number.isNaN(value.getTime())) return { value };
  if (typeof value !== 'string') {
    return { error: `${fieldLabel} must be a valid date string.` };
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { error: `${fieldLabel} must be a valid date.` };
  }
  return { value: parsed };
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const issueUnsubscribeToken = async (subscriber) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  subscriber.unsubscribeTokenHash = hashToken(rawToken);
  await subscriber.save();
  return rawToken;
};

const applyStatusDates = (subscriber, status) => {
  if (status === 'subscribed') {
    subscriber.subscribedAt = new Date();
    subscriber.unsubscribedAt = null;
  } else if (status === 'unsubscribed') {
    subscriber.unsubscribedAt = new Date();
  }
};

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3001').replace(/\/+$/, '');

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const stripHtml = (html) => String(html || '')
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const normalizeAudienceFilters = (value) => {
  if (value === undefined || value === null || value === '') {
    return { value: {} };
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return { error: 'Audience filters must be an object.' };
  }

  const normalized = {};

  const statusResult = normalizeEnum(value.status, SUBSCRIBER_STATUSES, 'Audience status');
  if (statusResult.error) return statusResult;
  if (statusResult.value) normalized.status = statusResult.value;

  const localeResult = normalizeLocale(value.locale);
  if (localeResult.error) return localeResult;
  if (localeResult.value) normalized.locale = localeResult.value;

  const sourceResult = normalizeEnum(value.source, SUBSCRIBER_SOURCES, 'Audience source');
  if (sourceResult.error) return sourceResult;
  if (sourceResult.value) normalized.source = sourceResult.value;

  const tagResult = normalizeOptionalText(value.tag, 'Audience tag', 1, 100);
  if (tagResult.error) return tagResult;

  const tagsResult = normalizeTags(value.tags);
  if (tagsResult.error) return tagsResult;

  const normalizedTags = Array.from(new Set([
    ...(Array.isArray(tagsResult.value) ? tagsResult.value : []),
    ...(tagResult.value ? [tagResult.value] : []),
  ].map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)));
  if (normalizedTags.length > 0) normalized.tags = normalizedTags;

  const subscribedFromResult = normalizeDateInput(value.subscribedFrom, 'Audience subscribedFrom');
  if (subscribedFromResult.error) return subscribedFromResult;
  if (subscribedFromResult.value) normalized.subscribedFrom = subscribedFromResult.value.toISOString();

  const subscribedToResult = normalizeDateInput(value.subscribedTo, 'Audience subscribedTo');
  if (subscribedToResult.error) return subscribedToResult;
  if (subscribedToResult.value) normalized.subscribedTo = subscribedToResult.value.toISOString();

  const createdFromResult = normalizeDateInput(value.createdFrom, 'Audience createdFrom');
  if (createdFromResult.error) return createdFromResult;
  if (createdFromResult.value) normalized.createdFrom = createdFromResult.value.toISOString();

  const createdToResult = normalizeDateInput(value.createdTo, 'Audience createdTo');
  if (createdToResult.error) return createdToResult;
  if (createdToResult.value) normalized.createdTo = createdToResult.value.toISOString();

  return { value: normalized };
};

const buildAudienceWhere = (audienceFilters = {}, { defaultStatus = 'subscribed' } = {}) => {
  const where = {};
  if (audienceFilters.status) {
    where.status = audienceFilters.status;
  } else if (defaultStatus) {
    where.status = defaultStatus;
  }

  if (audienceFilters.locale) {
    where.locale = audienceFilters.locale;
  }

  if (audienceFilters.source) {
    where.source = audienceFilters.source;
  }

  const subscribedRange = {};
  if (audienceFilters.subscribedFrom) {
    const fromDate = new Date(audienceFilters.subscribedFrom);
    if (!Number.isNaN(fromDate.getTime())) subscribedRange[Op.gte] = fromDate;
  }
  if (audienceFilters.subscribedTo) {
    const toDate = new Date(audienceFilters.subscribedTo);
    if (!Number.isNaN(toDate.getTime())) subscribedRange[Op.lte] = toDate;
  }
  if (Object.keys(subscribedRange).length > 0) where.subscribedAt = subscribedRange;

  const createdRange = {};
  if (audienceFilters.createdFrom) {
    const fromDate = new Date(audienceFilters.createdFrom);
    if (!Number.isNaN(fromDate.getTime())) createdRange[Op.gte] = fromDate;
  }
  if (audienceFilters.createdTo) {
    const toDate = new Date(audienceFilters.createdTo);
    if (!Number.isNaN(toDate.getTime())) createdRange[Op.lte] = toDate;
  }
  if (Object.keys(createdRange).length > 0) where.createdAt = createdRange;

  return where;
};

const isSubscriberEligibleByTags = (subscriber, requiredTags) => {
  if (!Array.isArray(requiredTags) || requiredTags.length === 0) return true;
  const normalizedRequiredTags = requiredTags
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean);
  if (normalizedRequiredTags.length === 0) return true;
  const subscriberTags = Array.isArray(subscriber.tags)
    ? subscriber.tags.map((tag) => String(tag).trim().toLowerCase())
    : [];
  return normalizedRequiredTags.every((requiredTag) => subscriberTags.includes(requiredTag));
};

async function getEligibleSubscribers(audienceFilters = {}, attributes = undefined) {
  const subscribers = await NewsletterSubscriber.findAll({
    where: buildAudienceWhere(audienceFilters),
    order: [['id', 'ASC']],
    ...(attributes ? { attributes } : {}),
  });

  return subscribers.filter((subscriber) => isSubscriberEligibleByTags(subscriber, audienceFilters.tags));
}

async function subscribePublic(payload = {}) {
  const emailResult = normalizeEmail(payload.email);
  if (emailResult.error) throw new ServiceError(400, emailResult.error);

  const nameResult = normalizeOptionalText(payload.name, 'Name', 1, 150);
  if (nameResult.error) throw new ServiceError(400, nameResult.error);

  const localeResult = normalizeLocale(payload.locale);
  if (localeResult.error) throw new ServiceError(400, localeResult.error);

  const email = emailResult.value;
  const existing = await NewsletterSubscriber.findOne({ where: { email } });

  if (existing) {
    existing.status = 'subscribed';
    existing.source = 'website';
    if (nameResult.value) existing.name = nameResult.value;
    if (localeResult.value) existing.locale = localeResult.value;
    applyStatusDates(existing, 'subscribed');
    await issueUnsubscribeToken(existing);
    return { message: NEWSLETTER_GENERIC_SUBSCRIBE_MESSAGE };
  }

  try {
    const subscriber = await NewsletterSubscriber.create({
      email,
      name: nameResult.value ?? null,
      locale: localeResult.value ?? null,
      source: 'website',
      status: 'subscribed',
      subscribedAt: new Date(),
      unsubscribedAt: null,
    });
    await issueUnsubscribeToken(subscriber);
  } catch (error) {
    // Duplicate-safe behavior for race conditions.
    if (error.name !== 'SequelizeUniqueConstraintError') {
      throw error;
    }
  }

  return { message: NEWSLETTER_GENERIC_SUBSCRIBE_MESSAGE };
}

async function getUserNewsletterPreference(user = {}) {
  const emailResult = normalizeEmail(user.email);
  if (emailResult.error) throw new ServiceError(400, 'User email is required.');

  const subscriber = await NewsletterSubscriber.findOne({
    where: { email: emailResult.value },
  });

  return {
    subscribed: subscriber?.status === 'subscribed',
    status: subscriber?.status || 'unsubscribed',
  };
}

async function updateUserNewsletterPreference(user = {}, payload = {}) {
  const emailResult = normalizeEmail(user.email);
  if (emailResult.error) throw new ServiceError(400, 'User email is required.');

  if (typeof payload.subscribed !== 'boolean') {
    throw new ServiceError(400, 'Subscribed must be a boolean.');
  }

  const email = emailResult.value;
  let subscriber = await NewsletterSubscriber.findOne({ where: { email } });

  if (payload.subscribed) {
    if (!subscriber) {
      try {
        subscriber = await NewsletterSubscriber.create({
          email,
          name: user.username || null,
          source: 'website',
          status: 'subscribed',
          subscribedAt: new Date(),
          unsubscribedAt: null,
        });
      } catch (error) {
        if (error.name !== 'SequelizeUniqueConstraintError') {
          throw error;
        }
        subscriber = await NewsletterSubscriber.findOne({ where: { email } });
      }
    }

    if (subscriber) {
      subscriber.status = 'subscribed';
      subscriber.source = subscriber.source || 'website';
      applyStatusDates(subscriber, 'subscribed');
      await issueUnsubscribeToken(subscriber);
    }

    return {
      subscribed: true,
      status: 'subscribed',
    };
  }

  if (subscriber) {
    subscriber.status = 'unsubscribed';
    applyStatusDates(subscriber, 'unsubscribed');
    await subscriber.save();
  }

  return {
    subscribed: false,
    status: 'unsubscribed',
  };
}

async function unsubscribePublic(token) {
  const tokenResult = normalizeOptionalText(token, 'Unsubscribe token', 1, 500);
  if (tokenResult.error) throw new ServiceError(400, tokenResult.error);
  if (!tokenResult.value) throw new ServiceError(400, 'Unsubscribe token is required.');

  const tokenHash = hashToken(tokenResult.value);
  const subscriber = await NewsletterSubscriber.findOne({
    where: { unsubscribeTokenHash: tokenHash },
  });

  if (!subscriber) {
    return { message: NEWSLETTER_GENERIC_UNSUBSCRIBE_MESSAGE };
  }

  subscriber.status = 'unsubscribed';
  applyStatusDates(subscriber, 'unsubscribed');
  await subscriber.save();

  return { message: NEWSLETTER_GENERIC_UNSUBSCRIBE_MESSAGE };
}

async function getAdminStats() {
  const [total, subscribed, pending, unsubscribed] = await Promise.all([
    NewsletterSubscriber.count(),
    NewsletterSubscriber.count({ where: { status: 'subscribed' } }),
    NewsletterSubscriber.count({ where: { status: 'pending' } }),
    NewsletterSubscriber.count({ where: { status: 'unsubscribed' } }),
  ]);

  return {
    total,
    byStatus: {
      subscribed,
      pending,
      unsubscribed,
    },
  };
}

async function listSubscribers(query = {}) {
  const rawPage = Number.parseInt(query.page, 10);
  const rawLimit = Number.parseInt(query.limit, 10);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;
  const offset = (page - 1) * limit;

  const where = {};

  const statusResult = normalizeEnum(query.status, SUBSCRIBER_STATUSES, 'Status');
  if (statusResult.error) throw new ServiceError(400, statusResult.error);
  if (statusResult.value) where.status = statusResult.value;

  const sourceResult = normalizeEnum(query.source, SUBSCRIBER_SOURCES, 'Source');
  if (sourceResult.error) throw new ServiceError(400, sourceResult.error);
  if (sourceResult.value) where.source = sourceResult.value;

  const localeResult = normalizeLocale(query.locale);
  if (localeResult.error) throw new ServiceError(400, localeResult.error);
  if (localeResult.value) where.locale = localeResult.value;

  const tagResult = normalizeOptionalText(query.tag, 'Tag', 1, 100);
  if (tagResult.error) throw new ServiceError(400, tagResult.error);
  if (tagResult.value) {
    where.tags = { [Op.like]: `%${tagResult.value}%` };
  }

  const createdFromResult = normalizeDateInput(query.createdFrom, 'Created from');
  if (createdFromResult.error) throw new ServiceError(400, createdFromResult.error);
  const createdToResult = normalizeDateInput(query.createdTo, 'Created to');
  if (createdToResult.error) throw new ServiceError(400, createdToResult.error);
  if (createdFromResult.value || createdToResult.value) {
    where.createdAt = {};
    if (createdFromResult.value) where.createdAt[Op.gte] = createdFromResult.value;
    if (createdToResult.value) where.createdAt[Op.lte] = createdToResult.value;
  }

  const subscribedFromResult = normalizeDateInput(query.subscribedFrom, 'Subscribed from');
  if (subscribedFromResult.error) throw new ServiceError(400, subscribedFromResult.error);
  const subscribedToResult = normalizeDateInput(query.subscribedTo, 'Subscribed to');
  if (subscribedToResult.error) throw new ServiceError(400, subscribedToResult.error);
  if (subscribedFromResult.value || subscribedToResult.value) {
    where.subscribedAt = {};
    if (subscribedFromResult.value) where.subscribedAt[Op.gte] = subscribedFromResult.value;
    if (subscribedToResult.value) where.subscribedAt[Op.lte] = subscribedToResult.value;
  }

  const searchResult = normalizeOptionalText(query.search, 'Search', 1, 100);
  if (searchResult.error) throw new ServiceError(400, searchResult.error);
  if (searchResult.value) {
    where[Op.or] = [
      { email: { [Op.like]: `%${searchResult.value.toLowerCase()}%` } },
      { name: { [Op.like]: `%${searchResult.value}%` } },
    ];
  }

  const { count, rows } = await NewsletterSubscriber.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return {
    subscribers: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

async function upsertSubscriber(input = {}, createdByAdminId = null, defaultSource = 'admin_manual') {
  const emailResult = normalizeEmail(input.email);
  if (emailResult.error) throw new ServiceError(400, emailResult.error);

  const nameResult = normalizeOptionalText(input.name, 'Name', 1, 150);
  if (nameResult.error) throw new ServiceError(400, nameResult.error);

  const notesResult = normalizeOptionalText(input.notes, 'Notes', 1, 5000);
  if (notesResult.error) throw new ServiceError(400, notesResult.error);

  const localeResult = normalizeLocale(input.locale);
  if (localeResult.error) throw new ServiceError(400, localeResult.error);

  const tagsResult = normalizeTags(input.tags);
  if (tagsResult.error) throw new ServiceError(400, tagsResult.error);

  const statusResult = normalizeEnum(input.status, SUBSCRIBER_STATUSES, 'Status');
  if (statusResult.error) throw new ServiceError(400, statusResult.error);

  const sourceResult = normalizeEnum(input.source, SUBSCRIBER_SOURCES, 'Source');
  if (sourceResult.error) throw new ServiceError(400, sourceResult.error);

  const status = statusResult.value || 'subscribed';
  const source = sourceResult.value || defaultSource;

  const existing = await NewsletterSubscriber.findOne({
    where: { email: emailResult.value },
  });

  if (existing) {
    existing.name = nameResult.value ?? existing.name;
    existing.notes = notesResult.value ?? existing.notes;
    existing.locale = localeResult.value ?? existing.locale;
    existing.tags = tagsResult.value ?? existing.tags;
    existing.status = status;
    existing.source = source;
    if (createdByAdminId != null) existing.createdByAdminId = createdByAdminId;
    applyStatusDates(existing, status);
    await issueUnsubscribeToken(existing);
    return { subscriber: existing, created: false };
  }

  const subscriber = await NewsletterSubscriber.create({
    email: emailResult.value,
    name: nameResult.value ?? null,
    notes: notesResult.value ?? null,
    locale: localeResult.value ?? null,
    tags: tagsResult.value ?? [],
    status,
    source,
    subscribedAt: status === 'subscribed' ? new Date() : null,
    unsubscribedAt: status === 'unsubscribed' ? new Date() : null,
    createdByAdminId,
  });

  await issueUnsubscribeToken(subscriber);
  return { subscriber, created: true };
}

async function addSubscriberByAdmin(payload = {}, createdByAdminId = null) {
  return upsertSubscriber(payload, createdByAdminId, 'admin_manual');
}

function parseBulkEmails(input) {
  if (typeof input !== 'string') return [];
  return Array.from(new Set(
    input
      .split(/[\s,;]+/g)
      .map((item) => item.trim())
      .filter(Boolean)
  ));
}

function parseCsvRows(text) {
  if (typeof text !== 'string' || !text.trim()) return [];
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(current);
      current = '';
      if (row.some((cell) => String(cell).trim() !== '')) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some((cell) => String(cell).trim() !== '')) {
      rows.push(row);
    }
  }

  return rows;
}

function resolveCsvColumnIndexMap(headerRow = []) {
  const normalizeHeader = (value) => String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
  const map = {};
  const aliases = {
    email: ['email', 'mail', 'e-mail'],
    name: ['name', 'fullname', 'full_name'],
    locale: ['locale', 'language'],
    tags: ['tags', 'tag'],
    source: ['source'],
    notes: ['notes', 'note'],
    status: ['status'],
  };
  const normalizedHeader = headerRow.map(normalizeHeader);
  for (const [key, keys] of Object.entries(aliases)) {
    const index = normalizedHeader.findIndex((headerValue) => keys.includes(headerValue));
    if (index >= 0) map[key] = index;
  }
  return map;
}

const splitTagValue = (value) => {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return undefined;
  return value
    .split(/[|,;]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

const formatCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = Array.isArray(value) ? value.join('|') : String(value);
  const escaped = stringValue.replace(/"/g, '""');
  if (/[",\r\n]/.test(escaped)) {
    return `"${escaped}"`;
  }
  return escaped;
};

function toCsv(subscribers = []) {
  const columns = [
    'email',
    'name',
    'status',
    'source',
    'locale',
    'tags',
    'subscribedAt',
    'unsubscribedAt',
    'notes',
    'createdAt',
    'updatedAt',
  ];
  const lines = [columns.join(',')];
  for (const subscriber of subscribers) {
    const row = columns.map((column) => {
      if (column === 'tags') return formatCsvValue(subscriber.tags || []);
      return formatCsvValue(subscriber[column]);
    });
    lines.push(row.join(','));
  }
  return `${lines.join('\n')}\n`;
}

async function exportSubscribersCsv(query = {}) {
  const where = {};

  const statusResult = normalizeEnum(query.status, SUBSCRIBER_STATUSES, 'Status');
  if (statusResult.error) throw new ServiceError(400, statusResult.error);
  if (statusResult.value) where.status = statusResult.value;

  const sourceResult = normalizeEnum(query.source, SUBSCRIBER_SOURCES, 'Source');
  if (sourceResult.error) throw new ServiceError(400, sourceResult.error);
  if (sourceResult.value) where.source = sourceResult.value;

  const localeResult = normalizeLocale(query.locale);
  if (localeResult.error) throw new ServiceError(400, localeResult.error);
  if (localeResult.value) where.locale = localeResult.value;

  const searchResult = normalizeOptionalText(query.search, 'Search', 1, 100);
  if (searchResult.error) throw new ServiceError(400, searchResult.error);
  if (searchResult.value) {
    where[Op.or] = [
      { email: { [Op.like]: `%${searchResult.value.toLowerCase()}%` } },
      { name: { [Op.like]: `%${searchResult.value}%` } },
    ];
  }

  const subscribers = await NewsletterSubscriber.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });

  const tagResult = normalizeOptionalText(query.tag, 'Tag', 1, 100);
  if (tagResult.error) throw new ServiceError(400, tagResult.error);
  const filtered = tagResult.value
    ? subscribers.filter((subscriber) => isSubscriberEligibleByTags(subscriber, [tagResult.value]))
    : subscribers;

  return {
    csv: toCsv(filtered),
    total: filtered.length,
  };
}

async function importSubscribersCsvByAdmin(payload = {}, createdByAdminId = null) {
  const csvTextResult = normalizeRequiredText(payload.csvText, 'CSV content', 1);
  if (csvTextResult.error) throw new ServiceError(400, csvTextResult.error);

  const rows = parseCsvRows(csvTextResult.value);
  if (rows.length < 1) {
    throw new ServiceError(400, 'CSV must include a header row and at least one data row.');
  }

  const header = rows[0];
  const dataRows = rows.slice(1);
  const indexMap = resolveCsvColumnIndexMap(header);
  if (indexMap.email === undefined) {
    throw new ServiceError(400, 'CSV must include an email column.');
  }

  const defaultSourceResult = normalizeEnum(payload.defaultSource, SUBSCRIBER_SOURCES, 'Default source');
  if (defaultSourceResult.error) throw new ServiceError(400, defaultSourceResult.error);
  const defaultStatusResult = normalizeEnum(payload.defaultStatus, SUBSCRIBER_STATUSES, 'Default status');
  if (defaultStatusResult.error) throw new ServiceError(400, defaultStatusResult.error);

  const summary = {
    totalRows: dataRows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    invalid: [],
  };

  for (const row of dataRows) {
    const read = (field) => {
      const index = indexMap[field];
      if (index === undefined) return undefined;
      const value = row[index];
      return typeof value === 'string' ? value.trim() : value;
    };

    const email = read('email');
    if (!email) {
      summary.skipped += 1;
      continue;
    }

    try {
      const { created } = await upsertSubscriber(
        {
          email,
          name: read('name'),
          locale: read('locale'),
          tags: splitTagValue(read('tags')),
          source: read('source') || defaultSourceResult.value || 'import',
          notes: read('notes'),
          status: read('status') || defaultStatusResult.value || 'subscribed',
        },
        createdByAdminId,
        defaultSourceResult.value || 'import'
      );

      if (created) {
        summary.created += 1;
      } else {
        summary.updated += 1;
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        summary.invalid.push({ email, reason: error.message });
      } else {
        throw error;
      }
    }
  }

  return summary;
}

async function bulkAddSubscribersByAdmin(payload = {}, createdByAdminId = null) {
  const entries = Array.isArray(payload.emails)
    ? payload.emails
    : parseBulkEmails(payload.emailsText);

  if (entries.length === 0) {
    throw new ServiceError(400, 'At least one email is required.');
  }

  const summary = {
    added: 0,
    updated: 0,
    invalid: [],
  };

  for (const email of entries) {
    try {
      const { created } = await upsertSubscriber(
        {
          email,
          name: payload.name,
          notes: payload.notes,
          locale: payload.locale,
          tags: payload.tags,
          status: payload.status,
          source: payload.source || 'import',
        },
        createdByAdminId,
        'import'
      );
      if (created) {
        summary.added += 1;
      } else {
        summary.updated += 1;
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        summary.invalid.push({ email, reason: error.message });
      } else {
        throw error;
      }
    }
  }

  return summary;
}

async function updateSubscriberByAdmin(id, payload = {}) {
  const subscriberId = Number.parseInt(id, 10);
  if (!Number.isInteger(subscriberId) || subscriberId <= 0) {
    throw new ServiceError(400, 'Subscriber ID must be a positive integer.');
  }

  const subscriber = await NewsletterSubscriber.findByPk(subscriberId);
  if (!subscriber) throw new ServiceError(404, 'Subscriber not found.');

  const nameResult = normalizeOptionalText(payload.name, 'Name', 1, 150);
  if (nameResult.error) throw new ServiceError(400, nameResult.error);

  const notesResult = normalizeOptionalText(payload.notes, 'Notes', 1, 5000);
  if (notesResult.error) throw new ServiceError(400, notesResult.error);

  const localeResult = normalizeLocale(payload.locale);
  if (localeResult.error) throw new ServiceError(400, localeResult.error);

  const tagsResult = normalizeTags(payload.tags);
  if (tagsResult.error) throw new ServiceError(400, tagsResult.error);

  const statusResult = normalizeEnum(payload.status, SUBSCRIBER_STATUSES, 'Status');
  if (statusResult.error) throw new ServiceError(400, statusResult.error);

  const sourceResult = normalizeEnum(payload.source, SUBSCRIBER_SOURCES, 'Source');
  if (sourceResult.error) throw new ServiceError(400, sourceResult.error);

  subscriber.name = nameResult.value !== undefined ? nameResult.value : subscriber.name;
  subscriber.notes = notesResult.value !== undefined ? notesResult.value : subscriber.notes;
  subscriber.locale = localeResult.value !== undefined ? localeResult.value : subscriber.locale;
  subscriber.tags = tagsResult.value !== undefined ? tagsResult.value : subscriber.tags;
  subscriber.source = sourceResult.value || subscriber.source;

  if (statusResult.value) {
    subscriber.status = statusResult.value;
    applyStatusDates(subscriber, statusResult.value);
    if (statusResult.value === 'subscribed') {
      await issueUnsubscribeToken(subscriber);
      return subscriber;
    }
  }

  await subscriber.save();
  return subscriber;
}

async function createUnsubscribeLinkForSubscriberEmail(email) {
  const emailResult = normalizeEmail(email);
  if (emailResult.error) throw new ServiceError(400, emailResult.error);

  const subscriber = await NewsletterSubscriber.findOne({ where: { email: emailResult.value } });
  if (!subscriber) throw new ServiceError(404, 'Subscriber not found.');

  const token = await issueUnsubscribeToken(subscriber);
  const baseUrl = getFrontendUrl();
  return `${baseUrl}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

function getBatchSize() {
  const parsed = Number.parseInt(process.env.NEWSLETTER_SEND_BATCH_SIZE || '', 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return 50;
  return Math.min(parsed, 100);
}

function getBatchDelayMs() {
  const parsed = Number.parseInt(process.env.NEWSLETTER_BATCH_DELAY_MS || '', 10);
  if (!Number.isInteger(parsed) || parsed < 0) return 0;
  return Math.min(parsed, 5000);
}

function normalizeCampaignPayload(payload = {}, { isCreate = false } = {}) {
  const updates = {};

  if (isCreate || payload.subject !== undefined) {
    const subjectResult = isCreate
      ? normalizeRequiredText(payload.subject, 'Subject', 1, 255)
      : normalizeOptionalText(payload.subject, 'Subject', 1, 255);
    if (subjectResult.error) return { error: subjectResult.error };
    if (isCreate) {
      updates.subject = subjectResult.value;
    } else if (subjectResult.value !== undefined) {
      updates.subject = subjectResult.value;
    }
  }

  if (isCreate || payload.htmlContent !== undefined) {
    const htmlResult = isCreate
      ? normalizeRequiredText(payload.htmlContent, 'HTML content', 1)
      : normalizeOptionalText(payload.htmlContent, 'HTML content', 1);
    if (htmlResult.error) return { error: htmlResult.error };
    if (isCreate) {
      updates.htmlContent = htmlResult.value;
    } else if (htmlResult.value !== undefined) {
      if (!htmlResult.value) return { error: 'HTML content cannot be empty.' };
      updates.htmlContent = htmlResult.value;
    }
  }

  const previewResult = normalizeOptionalText(payload.previewText, 'Preview text', 1, 500);
  if (previewResult.error) return { error: previewResult.error };
  if (previewResult.value !== undefined) updates.previewText = previewResult.value;

  const textResult = normalizeOptionalText(payload.textContent, 'Text content', 1, 20000);
  if (textResult.error) return { error: textResult.error };
  if (textResult.value !== undefined) updates.textContent = textResult.value;

  if (payload.scheduledAt !== undefined) {
    const scheduledAtResult = normalizeDateInput(payload.scheduledAt, 'Scheduled at');
    if (scheduledAtResult.error) return { error: scheduledAtResult.error };
    updates.scheduledAt = scheduledAtResult.value;
  }

  if (payload.audienceFilters !== undefined) {
    const audienceResult = normalizeAudienceFilters(payload.audienceFilters);
    if (audienceResult.error) return { error: audienceResult.error };
    updates.audienceFilters = audienceResult.value;
  }

  return { value: updates };
}

async function listCampaigns(query = {}) {
  const rawPage = Number.parseInt(query.page, 10);
  const rawLimit = Number.parseInt(query.limit, 10);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;
  const offset = (page - 1) * limit;

  const where = {};
  const statusResult = normalizeEnum(query.status, CAMPAIGN_STATUSES, 'Status');
  if (statusResult.error) throw new ServiceError(400, statusResult.error);
  if (statusResult.value) where.status = statusResult.value;

  const { count, rows } = await NewsletterCampaign.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'createdByAdmin',
        attributes: ['id', 'username', 'email'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    campaigns: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

async function createCampaignDraft(payload = {}, createdByAdminId) {
  const normalized = normalizeCampaignPayload(payload, { isCreate: true });
  if (normalized.error) throw new ServiceError(400, normalized.error);

  const shouldSchedule = normalized.value.scheduledAt instanceof Date;

  return NewsletterCampaign.create({
    ...normalized.value,
    createdByAdminId,
    status: shouldSchedule ? 'scheduled' : 'draft',
  });
}

async function getCampaignById(id) {
  const campaignId = Number.parseInt(id, 10);
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    throw new ServiceError(400, 'Campaign ID must be a positive integer.');
  }

  const campaign = await NewsletterCampaign.findByPk(campaignId, {
    include: [
      {
        model: User,
        as: 'createdByAdmin',
        attributes: ['id', 'username', 'email'],
      },
    ],
  });

  if (!campaign) throw new ServiceError(404, 'Campaign not found.');

  const [estimatedRecipients, recentLogs] = await Promise.all([
    getEligibleSubscribers(campaign.audienceFilters || {}, ['id']),
    NewsletterSendLog.findAll({
      where: { campaignId: campaign.id },
      order: [['createdAt', 'DESC']],
      limit: 10,
    }),
  ]);

  const allMatchingStatuses = await NewsletterSubscriber.findAll({
    where: buildAudienceWhere(campaign.audienceFilters || {}, { defaultStatus: null }),
    attributes: ['id', 'status', 'tags'],
  });
  const filteredStatuses = allMatchingStatuses.filter((subscriber) => isSubscriberEligibleByTags(subscriber, campaign.audienceFilters?.tags));
  const audienceSummary = filteredStatuses.reduce((acc, subscriber) => {
    const key = subscriber.status || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    campaign,
    estimatedRecipients: estimatedRecipients.length,
    audienceSummary,
    recentLogs,
  };
}

async function updateCampaignDraft(id, payload = {}) {
  const campaignId = Number.parseInt(id, 10);
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    throw new ServiceError(400, 'Campaign ID must be a positive integer.');
  }

  const campaign = await NewsletterCampaign.findByPk(campaignId);
  if (!campaign) throw new ServiceError(404, 'Campaign not found.');
  if (!['draft', 'scheduled'].includes(campaign.status)) {
    throw new ServiceError(409, 'Only draft or scheduled campaigns can be updated.');
  }

  const normalized = normalizeCampaignPayload(payload, { isCreate: false });
  if (normalized.error) throw new ServiceError(400, normalized.error);

  if (Object.keys(normalized.value).length === 0) {
    throw new ServiceError(400, 'No campaign fields were provided for update.');
  }

  Object.assign(campaign, normalized.value);
  if (Object.prototype.hasOwnProperty.call(normalized.value, 'scheduledAt')) {
    campaign.status = normalized.value.scheduledAt ? 'scheduled' : 'draft';
  }
  await campaign.save();
  return campaign;
}

async function scheduleCampaign(id, payload = {}) {
  const campaignId = Number.parseInt(id, 10);
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    throw new ServiceError(400, 'Campaign ID must be a positive integer.');
  }

  const campaign = await NewsletterCampaign.findByPk(campaignId);
  if (!campaign) throw new ServiceError(404, 'Campaign not found.');
  if (!['draft', 'failed', 'scheduled'].includes(campaign.status)) {
    throw new ServiceError(409, 'Only draft, failed, or scheduled campaigns can be scheduled.');
  }

  const scheduledAtResult = normalizeDateInput(payload.scheduledAt, 'Scheduled at');
  if (scheduledAtResult.error) throw new ServiceError(400, scheduledAtResult.error);
  if (!scheduledAtResult.value) throw new ServiceError(400, 'Scheduled at is required.');

  campaign.scheduledAt = scheduledAtResult.value;
  campaign.status = 'scheduled';
  await campaign.save();
  return campaign;
}

async function renderCampaignEmail(campaign, recipientEmail) {
  const unsubscribeLink = await createUnsubscribeLinkForSubscriberEmail(recipientEmail);
  return buildCampaignMessage({
    campaign,
    unsubscribeLink,
    isTest: false,
  });
}

async function renderCampaignTestEmail(campaign, testEmail) {
  let unsubscribeLink = `${getFrontendUrl()}/newsletter/unsubscribe`;

  try {
    unsubscribeLink = await createUnsubscribeLinkForSubscriberEmail(testEmail);
  } catch (error) {
    if (!(error instanceof ServiceError) || error.status !== 404) {
      throw error;
    }
  }

  return buildCampaignMessage({
    campaign,
    unsubscribeLink,
    isTest: true,
  });
}

function buildCampaignMessage({ campaign, unsubscribeLink, isTest }) {
  const safeUnsubscribeLink = escapeHtml(unsubscribeLink);
  const safePreviewText = campaign.previewText ? escapeHtml(campaign.previewText) : '';
  const htmlBody = campaign.htmlContent || '';
  const textBody = campaign.textContent || stripHtml(htmlBody);
  const title = isTest ? 'Appofa Newsletter (Test)' : 'Appofa Newsletter';
  const footerIntro = isTest
    ? 'This is a test send for an Appofa newsletter campaign.'
    : 'You are receiving this email as an Appofa newsletter/update.';
  const footerLinkLabel = isTest
    ? 'Unsubscribe link preview'
    : 'To stop receiving these emails, unsubscribe here';
  const subject = isTest ? `[TEST] ${campaign.subject}` : campaign.subject;
  const headers = isTest
    ? undefined
    : {
      'List-Unsubscribe': `<${unsubscribeLink}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };

  const html = `
    <html>
      <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#111827;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreviewText}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;background:#f8fafc;">
                    <p style="margin:0;font-size:20px;font-weight:700;color:#1f2937;">${title}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px;">${htmlBody}</td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;border-top:1px solid #e5e7eb;background:#f8fafc;font-size:12px;line-height:1.6;color:#6b7280;">
                    <p style="margin:0 0 8px;">${footerIntro}</p>
                    <p style="margin:0;"><a href="${safeUnsubscribeLink}" style="color:#2563eb;">${footerLinkLabel}</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = [
    ...(isTest ? ['[TEST SEND]'] : []),
    textBody,
    '',
    '---',
    footerIntro,
    `${isTest ? 'Unsubscribe link preview' : 'Unsubscribe'}: ${unsubscribeLink}`,
  ].join('\n');

  return { subject, html, text, headers };
}

async function sendMail({ to, subject, html, text, headers }) {
  return deliverMail({ to, subject, html, text, headers });
}

async function sendCampaignTestEmail(campaignId, payload = {}) {
  const campaign = await NewsletterCampaign.findByPk(campaignId);
  if (!campaign) throw new ServiceError(404, 'Campaign not found.');

  const emailResult = normalizeEmail(payload.email);
  if (emailResult.error) throw new ServiceError(400, emailResult.error);

  if (!campaign.subject || !campaign.htmlContent) {
    throw new ServiceError(400, 'Campaign requires subject and HTML content before test send.');
  }

  const rendered = await renderCampaignTestEmail(campaign, emailResult.value);
  await sendMail({
    to: emailResult.value,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    headers: rendered.headers,
  });

  return { email: emailResult.value };
}

async function sendCampaignNow(campaignId) {
  const campaign = await NewsletterCampaign.findByPk(campaignId);
  if (!campaign) throw new ServiceError(404, 'Campaign not found.');

  if (campaign.status === 'sending') {
    throw new ServiceError(409, 'Campaign is already being sent.');
  }

  if (!campaign.subject || !campaign.htmlContent) {
    throw new ServiceError(400, 'Campaign requires subject and HTML content before sending.');
  }

  if (!['draft', 'failed', 'scheduled'].includes(campaign.status)) {
    throw new ServiceError(409, 'Only draft, scheduled, or failed campaigns can be sent.');
  }

  const [claimed] = await NewsletterCampaign.update({
    status: 'sending',
    sentAt: null,
    scheduledAt: null,
    totalRecipients: 0,
    successCount: 0,
    failureCount: 0,
  }, {
    where: {
      id: campaign.id,
      status: { [Op.in]: ['draft', 'failed', 'scheduled'] },
    },
  });

  if (claimed === 0) {
    throw new ServiceError(409, 'Campaign state changed. Please refresh and retry.');
  }

  await campaign.reload();

  const recipients = await getEligibleSubscribers(campaign.audienceFilters || {}, ['id', 'email', 'tags']);
  campaign.totalRecipients = recipients.length;
  await campaign.save();

  const batchSize = getBatchSize();
  const batchDelayMs = getBatchDelayMs();
  let successCount = 0;
  let failureCount = 0;

  try {
    for (let offset = 0; offset < recipients.length; offset += batchSize) {
      const batch = recipients.slice(offset, offset + batchSize);
      const batchResults = await Promise.all(batch.map(async (subscriber) => {
        const log = await NewsletterSendLog.create({
          campaignId: campaign.id,
          subscriberId: subscriber.id,
          email: subscriber.email,
          status: 'queued',
        });

        try {
          const rendered = await renderCampaignEmail(campaign, subscriber.email);
          const info = await sendMail({
            to: subscriber.email,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
            headers: rendered.headers,
          });

          log.status = 'sent';
          log.providerMessageId = info?.messageId || null;
          log.errorMessage = null;
          log.sentAt = new Date();
          await log.save();
          return { success: 1, failure: 0 };
        } catch (error) {
          const rawErrorMessage = typeof error?.message === 'string' && error.message.trim()
            ? error.message.trim()
            : 'Unknown send error.';
          log.status = 'failed';
          log.errorMessage = rawErrorMessage.slice(0, 5000);
          log.sentAt = null;
          await log.save();
          return { success: 0, failure: 1 };
        }
      }));

      for (const result of batchResults) {
        successCount += result.success;
        failureCount += result.failure;
      }

      campaign.successCount = successCount;
      campaign.failureCount = failureCount;
      await campaign.save();

      await new Promise((resolve) => {
        if (batchDelayMs > 0) {
          setTimeout(resolve, batchDelayMs);
          return;
        }
        setImmediate(resolve);
      });
    }
  } catch (error) {
    campaign.status = 'failed';
    campaign.sentAt = new Date();
    campaign.successCount = successCount;
    campaign.failureCount = failureCount;
    await campaign.save();
    throw error;
  }

  campaign.status = failureCount > 0 ? 'failed' : 'sent';
  campaign.sentAt = new Date();
  campaign.successCount = successCount;
  campaign.failureCount = failureCount;
  await campaign.save();

  return {
    campaign,
    summary: {
      totalRecipients: recipients.length,
      successCount,
      failureCount,
    },
  };
}

async function processDueScheduledCampaigns({ limit = 5 } = {}) {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 5;
  const dueCampaigns = await NewsletterCampaign.findAll({
    where: {
      status: 'scheduled',
      scheduledAt: {
        [Op.lte]: new Date(),
      },
    },
    order: [['scheduledAt', 'ASC'], ['id', 'ASC']],
    limit: safeLimit,
    attributes: ['id'],
  });

  let processed = 0;
  let failed = 0;

  for (const campaign of dueCampaigns) {
    try {
      await sendCampaignNow(campaign.id);
      processed += 1;
    } catch (error) {
      failed += 1;
      console.error('[newsletter] scheduled campaign processing failed:', error?.message || error);
    }
  }

  return {
    due: dueCampaigns.length,
    processed,
    failed,
  };
}

async function listCampaignSendLogs(campaignId, query = {}) {
  const campaign = await NewsletterCampaign.findByPk(campaignId);
  if (!campaign) throw new ServiceError(404, 'Campaign not found.');

  const rawPage = Number.parseInt(query.page, 10);
  const rawLimit = Number.parseInt(query.limit, 10);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 50;
  const offset = (page - 1) * limit;

  const where = { campaignId: campaign.id };
  const statusResult = normalizeEnum(query.status, SEND_LOG_STATUSES, 'Log status');
  if (statusResult.error) throw new ServiceError(400, statusResult.error);
  if (statusResult.value) where.status = statusResult.value;

  const { count, rows } = await NewsletterSendLog.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    campaign: {
      id: campaign.id,
      subject: campaign.subject,
      status: campaign.status,
      totalRecipients: campaign.totalRecipients,
      successCount: campaign.successCount,
      failureCount: campaign.failureCount,
      sentAt: campaign.sentAt,
    },
    logs: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

module.exports = {
  ServiceError,
  SUBSCRIBER_STATUSES,
  SUBSCRIBER_SOURCES,
  CAMPAIGN_STATUSES,
  SEND_LOG_STATUSES,
  NEWSLETTER_GENERIC_SUBSCRIBE_MESSAGE,
  NEWSLETTER_GENERIC_UNSUBSCRIBE_MESSAGE,
  subscribePublic,
  getUserNewsletterPreference,
  updateUserNewsletterPreference,
  unsubscribePublic,
  getAdminStats,
  listSubscribers,
  addSubscriberByAdmin,
  bulkAddSubscribersByAdmin,
  importSubscribersCsvByAdmin,
  exportSubscribersCsv,
  updateSubscriberByAdmin,
  createUnsubscribeLinkForSubscriberEmail,
  issueUnsubscribeToken,
  listCampaigns,
  createCampaignDraft,
  getCampaignById,
  updateCampaignDraft,
  scheduleCampaign,
  sendCampaignTestEmail,
  sendCampaignNow,
  processDueScheduledCampaigns,
  listCampaignSendLogs,
  getEligibleSubscribers,
};
