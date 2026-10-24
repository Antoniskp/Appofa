const { Op } = require('sequelize');
const { User, NewsletterSubscriber, NewsletterSendLog } = require('../models');
const { getDescendantLocationIds } = require('../utils/locationUtils');

const TOPICS = ['general', 'local', 'activity'];
const SEGMENTS = ['all', 'registered', 'missing_location', 'with_location', 'newsletter_only'];
const DEFAULT_PREFERENCES = { general: true, local: false, activity: false };
const emailKey = (email) => String(email || '').trim().toLowerCase();

async function accountMap() {
  const users = await User.findAll({
    where: { claimStatus: null },
    attributes: ['id', 'email', 'homeLocationId', 'emailVerified'],
  });
  return new Map(users.map((user) => [emailKey(user.email), user]));
}

function matchesSegment(user, segment = 'all') {
  if (segment === 'registered') return Boolean(user);
  if (segment === 'missing_location') return Boolean(user && !user.homeLocationId);
  if (segment === 'with_location') return Boolean(user?.homeLocationId);
  if (segment === 'newsletter_only') return !user;
  return true;
}

function exclusionReason(subscriber, user, filters = {}) {
  if (filters.status && filters.status !== 'subscribed') return 'invalidCampaignStatus';
  if (subscriber.status !== 'subscribed') return subscriber.status || 'unsubscribed';
  if (!matchesSegment(user, filters.segment)) return 'outsideSegment';
  if (filters.locationIds && !filters.locationIds.includes(user?.homeLocationId)) return 'outsideLocation';
  const preferences = subscriber.preferences || DEFAULT_PREFERENCES;
  if (!preferences[filters.topic || 'general']) return 'topicOptOut';
  if (filters.purpose === 'profile_location') {
    if (!user || user.homeLocationId) return 'locationCompleteOrNoAccount';
    if (!user.emailVerified) return 'unverifiedEmail';
    if (subscriber.profileReminderSentAt) return 'alreadyReminded';
    if (subscriber.profileReminderClaimedAt) return 'reminderInProgress';
  }
  return null;
}

async function accountStats() {
  const [accounts, subscribers, failures] = await Promise.all([
    accountMap(),
    NewsletterSubscriber.findAll({ attributes: ['email', 'status', 'profileReminderSentAt'] }),
    NewsletterSendLog.count({ where: { status: 'failed' }, distinct: true, col: 'email' }),
  ]);
  const optedIn = new Set(subscribers.filter((s) => s.status === 'subscribed').map((s) => emailKey(s.email)));
  const users = [...accounts.values()];
  return {
    registered: users.length,
    missingLocation: users.filter((u) => !u.homeLocationId).length,
    locatedWithoutSubscription: users.filter((u) => u.homeLocationId && !optedIn.has(emailKey(u.email))).length,
    registeredSubscribed: users.filter((u) => optedIn.has(emailKey(u.email))).length,
    addressesWithSendFailures: failures,
    reminded: subscribers.filter((s) => s.profileReminderSentAt).length,
    completedAfterReminder: subscribers.filter((s) => s.profileReminderSentAt && accounts.get(emailKey(s.email))?.homeLocationId).length,
  };
}

// A durable claim prevents two campaigns from sending the same reminder concurrently.
// An interrupted/uncertain delivery remains claimed for manual review, never automatic retry.
async function claimReminder(id) {
  const [count] = await NewsletterSubscriber.update({ profileReminderClaimedAt: new Date() }, {
    where: { id, status: 'subscribed', profileReminderSentAt: { [Op.is]: null }, profileReminderClaimedAt: { [Op.is]: null } },
  });
  return count === 1;
}

async function resolveFilters(filters = {}) {
  return { ...filters, ...(filters.locationId ? { locationIds: await getDescendantLocationIds(filters.locationId, true) } : {}) };
}

module.exports = { TOPICS, SEGMENTS, DEFAULT_PREFERENCES, emailKey, accountMap, matchesSegment, exclusionReason, accountStats, claimReminder, resolveFilters };
