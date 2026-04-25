const { IpAccessRule, User } = require('../models');
const { normalizeIp } = require('../utils/normalizeIp');

let cache = null;
let cacheExpiry = 0;
const CACHE_TTL = 60 * 1000;

async function getIpRulesCache() {
  if (cache && Date.now() < cacheExpiry) return cache;
  const rules = await IpAccessRule.findAll({ attributes: ['ip', 'type'] });
  const whitelist = new Set();
  const blacklist = new Set();
  for (const rule of rules) {
    const ip = normalizeIp(rule.ip) || rule.ip;
    if (rule.type === 'whitelist') whitelist.add(ip);
    else if (rule.type === 'blacklist') blacklist.add(ip);
  }
  cache = { whitelist, blacklist };
  cacheExpiry = Date.now() + CACHE_TTL;
  return cache;
}

function invalidateCache() {
  cache = null;
  cacheExpiry = 0;
}

async function listRules() {
  return IpAccessRule.findAll({
    include: [{ model: User, as: 'createdBy', attributes: ['id', 'username'] }],
    order: [['createdAt', 'DESC']],
  });
}

async function addRule(ip, type, reason, userId) {
  const canonicalIp = normalizeIp(ip);
  if (!canonicalIp) {
    const err = new Error('Invalid IP address.');
    err.status = 400;
    throw err;
  }
  const rule = await IpAccessRule.create({ ip: canonicalIp, type, reason, createdByUserId: userId });
  invalidateCache();
  return rule;
}

async function removeRule(ip) {
  // Normalize so ::ffff: prefixes are stripped; fall back to raw value only for
  // legacy rows that may have been stored in non-canonical form before this fix.
  const canonicalIp = normalizeIp(ip) || String(ip || '').trim();
  const deleted = await IpAccessRule.destroy({ where: { ip: canonicalIp } });
  invalidateCache();
  return deleted;
}

module.exports = { getIpRulesCache, invalidateCache, listRules, addRule, removeRule };
