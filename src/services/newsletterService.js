const crypto = require('crypto');
const nodemailer = require('nodemailer');
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

const SUBSCRIBER_STATUSES = ['pending', 'subscribed', 'unsubscribed'];
const SUBSCRIBER_SOURCES = ['website', 'admin_manual', 'import'];
const CAMPAIGN_STATUSES = ['draft', 'sending', 'sent', 'failed'];
const SEND_LOG_STATUSES = ['queued', 'sent', 'failed'];
const NEWSLETTER_GENERIC_SUBSCRIBE_MESSAGE = 'If this email can receive newsletter updates, it has been added or updated.';
const NEWSLETTER_GENERIC_UNSUBSCRIBE_MESSAGE = 'If this unsubscribe link is valid, the email has been unsubscribed.';
const NEWSLETTER_FROM_DEFAULT = 'Appofa <no-reply@appofasi.gr>';

let smtpTransporter = null;

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

const toBoolean = (value, defaultValue = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return defaultValue;
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

const getSmtpTransporter = () => {
  if (smtpTransporter) return smtpTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT || '', 10);
  const secure = toBoolean(process.env.SMTP_SECURE, false);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const missingKeys = [];
  if (!host) missingKeys.push('SMTP_HOST');
  if (!Number.isInteger(port)) missingKeys.push('SMTP_PORT');
  if (!user) missingKeys.push('SMTP_USER');
  if (!pass) missingKeys.push('SMTP_PASS');

  if (missingKeys.length > 0) {
    throw new Error(`SMTP configuration is incomplete. Missing/invalid: ${missingKeys.join(', ')}`);
  }

  smtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return smtpTransporter;
};

const normalizeAudienceFilters = (value) => {
  if (value === undefined || value === null || value === '') {
    return { value: {} };
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return { error: 'Audience filters must be an object.' };
  }

  const normalized = {};

  const localeResult = normalizeLocale(value.locale);
  if (localeResult.error) return localeResult;
  if (localeResult.value) normalized.locale = localeResult.value;

  const sourceResult = normalizeEnum(value.source, SUBSCRIBER_SOURCES, 'Audience source');
  if (sourceResult.error) return sourceResult;
  if (sourceResult.value) normalized.source = sourceResult.value;

  const tagResult = normalizeOptionalText(value.tag, 'Audience tag', 1, 100);
  if (tagResult.error) return tagResult;
  if (tagResult.value) normalized.tag = tagResult.value;

  return { value: normalized };
};

const buildAudienceWhere = (audienceFilters = {}) => {
  const where = { status: 'subscribed' };

  if (audienceFilters.locale) {
    where.locale = audienceFilters.locale;
  }

  if (audienceFilters.source) {
    where.source = audienceFilters.source;
  }

  return where;
};

const isSubscriberEligibleByTag = (subscriber, requiredTag) => {
  if (!requiredTag) return true;
  const normalizedRequiredTag = requiredTag.trim().toLowerCase();
  return Array.isArray(subscriber.tags)
    && subscriber.tags.some((tag) => String(tag).trim().toLowerCase() === normalizedRequiredTag);
};

async function getEligibleSubscribers(audienceFilters = {}, attributes = undefined) {
  const subscribers = await NewsletterSubscriber.findAll({
    where: buildAudienceWhere(audienceFilters),
    order: [['id', 'ASC']],
    ...(attributes ? { attributes } : {}),
  });

  if (!audienceFilters.tag) return subscribers;
  return subscribers.filter((subscriber) => isSubscriberEligibleByTag(subscriber, audienceFilters.tag));
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
  const baseUrl = getFrontendUrl();
  return `${baseUrl}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

function getBatchSize() {
  const parsed = Number.parseInt(process.env.NEWSLETTER_SEND_BATCH_SIZE || '', 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return 50;
  return Math.min(parsed, 500);
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

  return NewsletterCampaign.create({
    ...normalized.value,
    createdByAdminId,
    status: 'draft',
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

  const estimatedRecipients = (await getEligibleSubscribers(campaign.audienceFilters || {}, ['id'])).length;

  return {
    campaign,
    estimatedRecipients,
  };
}

async function updateCampaignDraft(id, payload = {}) {
  const campaignId = Number.parseInt(id, 10);
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    throw new ServiceError(400, 'Campaign ID must be a positive integer.');
  }

  const campaign = await NewsletterCampaign.findByPk(campaignId);
  if (!campaign) throw new ServiceError(404, 'Campaign not found.');
  if (campaign.status !== 'draft') {
    throw new ServiceError(409, 'Only draft campaigns can be updated.');
  }

  const normalized = normalizeCampaignPayload(payload, { isCreate: false });
  if (normalized.error) throw new ServiceError(400, normalized.error);

  if (Object.keys(normalized.value).length === 0) {
    throw new ServiceError(400, 'No campaign fields were provided for update.');
  }

  Object.assign(campaign, normalized.value);
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
    '—',
    footerIntro,
    `${isTest ? 'Unsubscribe link preview' : 'Unsubscribe'}: ${unsubscribeLink}`,
  ].join('\n');

  return { subject, html, text };
}

async function sendMail({ to, subject, html, text }) {
  const transporter = getSmtpTransporter();
  const from = process.env.SMTP_FROM || NEWSLETTER_FROM_DEFAULT;

  return transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
  });
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

  if (!['draft', 'failed'].includes(campaign.status)) {
    throw new ServiceError(409, 'Only draft or failed campaigns can be sent.');
  }

  campaign.status = 'sending';
  campaign.sentAt = null;
  campaign.totalRecipients = 0;
  campaign.successCount = 0;
  campaign.failureCount = 0;
  await campaign.save();

  await NewsletterSendLog.destroy({ where: { campaignId: campaign.id } });

  const recipients = await getEligibleSubscribers(campaign.audienceFilters || {}, ['id', 'email', 'tags']);
  campaign.totalRecipients = recipients.length;
  await campaign.save();

  const batchSize = getBatchSize();
  let successCount = 0;
  let failureCount = 0;

  try {
    for (let offset = 0; offset < recipients.length; offset += batchSize) {
      const batch = recipients.slice(offset, offset + batchSize);

      for (const subscriber of batch) {
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
          });

          log.status = 'sent';
          log.providerMessageId = info?.messageId || null;
          log.errorMessage = null;
          log.sentAt = new Date();
          await log.save();
          successCount += 1;
        } catch (error) {
          log.status = 'failed';
          log.errorMessage = normalizeOptionalText(error?.message || 'Unknown send error.', 'Error', 1, 5000).value || 'Unknown send error.';
          log.sentAt = null;
          await log.save();
          failureCount += 1;
        }
      }

      campaign.successCount = successCount;
      campaign.failureCount = failureCount;
      await campaign.save();

      await new Promise((resolve) => setImmediate(resolve));
    }
  } catch (error) {
    campaign.status = 'failed';
    campaign.sentAt = new Date();
    campaign.successCount = successCount;
    campaign.failureCount = failureCount;
    await campaign.save();
    throw error;
  }

  campaign.status = failureCount > 0 && successCount === 0 ? 'failed' : 'sent';
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
  unsubscribePublic,
  getAdminStats,
  listSubscribers,
  addSubscriberByAdmin,
  bulkAddSubscribersByAdmin,
  updateSubscriberByAdmin,
  createUnsubscribeLinkForSubscriberEmail,
  issueUnsubscribeToken,
  listCampaigns,
  createCampaignDraft,
  getCampaignById,
  updateCampaignDraft,
  sendCampaignTestEmail,
  sendCampaignNow,
  listCampaignSendLogs,
  getEligibleSubscribers,
};
