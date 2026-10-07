'use strict';

const { Op } = require('sequelize');
const { Location, GovernmentPosition } = require('../models');

const validId = value => /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value));
const validRecipientKey = value => typeof value === 'string' && /^(mayor|regional|position):[1-9]\d*$/.test(value);

// Address offices, not individual account holders: an election must not orphan proposals.
async function getRecipients(locationId) {
  if (!validId(locationId)) return { error: 'A valid location is required.' };
  const ancestors = [];
  const seen = new Set();
  let id = Number(locationId);
  while (id && !seen.has(id)) {
    seen.add(id);
    const location = await Location.findByPk(id, { attributes: ['id', 'parent_id', 'name', 'name_local', 'type', 'code'] });
    if (!location) break;
    ancestors.push(location);
    id = location.parent_id;
  }
  if (!ancestors.length) return { error: 'Location not found.' };
  const data = [];
  for (const location of ancestors) {
    const kind = location.type === 'municipality' ? 'mayor' : location.type === 'prefecture' ? 'regional' : null;
    if (kind) data.push({ key: `${kind}:${location.id}`, kind, locationId: location.id, locationName: location.name_local || location.name });
  }
  const country = ancestors.find(location => location.type === 'country');
  if (country?.code) {
    const countryCode = country.code.toUpperCase() === 'EL' ? 'GR' : country.code.toUpperCase();
    const positions = await GovernmentPosition.findAll({
      where: { isActive: true, countryCode, [Op.or]: [
        { scope: 'national', jurisdictionId: null },
        { jurisdictionId: { [Op.in]: ancestors.map(location => location.id) } },
      ] },
      order: [['order', 'ASC'], ['id', 'ASC']],
      attributes: ['id', 'title', 'titleEn', 'jurisdictionId'],
    });
    for (const position of positions) {
      const jurisdiction = ancestors.find(location => location.id === position.jurisdictionId) || country;
      data.push({ key: `position:${position.id}`, kind: 'position', title: position.title, titleEn: position.titleEn,
        locationId: jurisdiction.id, locationName: jurisdiction.name_local || jurisdiction.name });
    }
  }
  return { data };
}

async function resolveRecipient(key, locationId) {
  if (key === null || key === undefined || key === '') return { recipientKey: null, recipient: null };
  if (!validRecipientKey(key)) return { error: 'Invalid recipient.' };
  const result = await getRecipients(locationId);
  if (result.error) return result;
  const recipient = result.data.find(item => item.key === key);
  if (!recipient) return { error: 'Choose an active office serving the selected location.' };
  return { recipientKey: recipient.key, recipient };
}

module.exports = { getRecipients, resolveRecipient, validRecipientKey };
