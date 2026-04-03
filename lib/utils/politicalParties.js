import partiesData from '@/config/politicalParties.json';

const parties = partiesData.parties;

export function getAllParties(activeOnly = true) {
  return activeOnly ? parties.filter((p) => p.active) : parties;
}

export function getPartyById(id) {
  if (!id) return null;
  return parties.find((p) => p.id === id) || null;
}

export function getPartyName(id, lang = 'gr') {
  const party = getPartyById(id);
  if (!party) return null;
  return lang === 'en' ? party.nameEn : party.name;
}

export function getPartyColor(id) {
  return getPartyById(id)?.color || null;
}

export function getPartyLogo(id) {
  return getPartyById(id)?.logo || null;
}
