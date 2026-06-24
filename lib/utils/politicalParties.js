import partiesData from '@/config/politicalParties.json';

const parties = partiesData.parties;

/**
 * Human-readable labels for political spectrum positions.
 * Mirrors the ENUM used in the Organization.politicalPosition field.
 */
export const POSITION_LABELS = {
  'far-left': 'Ακροαριστερά',
  'left': 'Αριστερά',
  'center-left': 'Κεντροαριστερά',
  'center-right': 'Κεντροδεξιά',
  'right': 'Δεξιά',
  'far-right': 'Ακροδεξιά',
  'independent': 'Ανεξάρτητος',
};

/**
 * Human-readable labels for endorsement levels used in UserPoliticalAffiliation.
 */
export const ENDORSEMENT_LABELS = {
  active: 'Ενεργό μέλος',
  passive: 'Παθητικό μέλος',
  neutral: 'Συμπαθών/ούσα',
};

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

/**
 * Returns the Greek label for a political spectrum position value.
 * Falls back to the raw value if no label is found.
 * @param {string|null} position
 * @returns {string|null}
 */
export function formatPoliticalPosition(position) {
  if (!position) return null;
  return POSITION_LABELS[position] ?? position;
}
