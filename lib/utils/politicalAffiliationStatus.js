export const POLITICAL_AFFILIATION_STATUS = {
  PARTY: 'party',
  UNAFFILIATED: 'unaffiliated',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say',
  OTHER: 'other',
};

export const POLITICAL_AFFILIATION_STATUS_LABELS = {
  [POLITICAL_AFFILIATION_STATUS.PARTY]: 'Κόμμα / πολιτικός οργανισμός',
  [POLITICAL_AFFILIATION_STATUS.UNAFFILIATED]: 'Ανεξάρτητος / χωρίς κομματική ένταξη',
  [POLITICAL_AFFILIATION_STATUS.PREFER_NOT_TO_SAY]: 'Δεν θέλω να απαντήσω',
  [POLITICAL_AFFILIATION_STATUS.OTHER]: 'Άλλο',
};

export function formatPoliticalAffiliationStatus(status, otherText = '') {
  if (status === POLITICAL_AFFILIATION_STATUS.OTHER && otherText) {
    return `${POLITICAL_AFFILIATION_STATUS_LABELS[status]}: ${otherText}`;
  }
  return POLITICAL_AFFILIATION_STATUS_LABELS[status] || null;
}
