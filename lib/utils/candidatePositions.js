/**
 * Maps a candidate position value to its Greek label.
 * @param {string} position - 'mayor' | 'prefect' | 'parliamentary'
 * @returns {string} Greek label, or empty string if unknown
 */
export function positionLabel(position) {
  const labels = {
    mayor: 'Δήμαρχος',
    prefect: 'Περιφερειάρχης',
    parliamentary: 'Βουλευτής'
  };
  return labels[position] || '';
}

/**
 * Returns the location type required for the given candidate position's constituency.
 * @param {string} position - 'mayor' | 'prefect' | 'parliamentary'
 * @returns {'municipality'|'prefecture'|null}
 */
export function positionConstituencyType(position) {
  if (position === 'mayor') return 'municipality';
  if (position === 'prefect' || position === 'parliamentary') return 'prefecture';
  return null;
}
