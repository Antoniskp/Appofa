const crypto = require('crypto');
const { Op } = require('sequelize');
const { NewsletterSubscriber } = require('../models');
const {
  normalizeEmail,
  normalizeOptionalText,
  normalizeEnum,
  normalizeStringArray,
} = require('../utils/validators');

const SUBSCRIBER_STATUSES = ['pending', 'subscribed', 'unsubscribed'];
const SUBSCRIBER_SOURCES = ['website', 'admin_manual', 'import'];
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
  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3001').replace(/\/+$/, '');
  return `${baseUrl}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

module.exports = {
  ServiceError,
  SUBSCRIBER_STATUSES,
  SUBSCRIBER_SOURCES,
  NEWSLETTER_GENERIC_SUBSCRIBE_MESSAGE,
  NEWSLETTER_GENERIC_UNSUBSCRIBE_MESSAGE,
  subscribePublic,
  unsubscribePublic,
  getAdminStats,
  listSubscribers,
  addSubscriberByAdmin,
  bulkAddSubscribersByAdmin,
  updateSubscriberByAdmin,
  createUnsubscribeLinkForSubscriberEmail,
  issueUnsubscribeToken,
};
