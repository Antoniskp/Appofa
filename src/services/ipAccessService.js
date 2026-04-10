const { IpAccessRule, User } = require('../models');

let cache = null;
let cacheExpiry = 0;
const CACHE_TTL = 60 * 1000;

async function getIpRulesCache() {
  if (cache && Date.now() < cacheExpiry) return cache;
  const rules = await IpAccessRule.findAll({ attributes: ['ip', 'type'] });
  const whitelist = new Set();
  const blacklist = new Set();
  for (const rule of rules) {
    if (rule.type === 'whitelist') whitelist.add(rule.ip);
    else blacklist.add(rule.ip);
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
  const rule = await IpAccessRule.create({ ip, type, reason, createdByUserId: userId });
  invalidateCache();
  return rule;
}

async function removeRule(ip) {
  const deleted = await IpAccessRule.destroy({ where: { ip } });
  invalidateCache();
  return deleted;
}

module.exports = { getIpRulesCache, invalidateCache, listRules, addRule, removeRule };
