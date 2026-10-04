import { getPartyColor } from './party-logo';

// Shared across the homepage and full results. Colors follow ballot order,
// not vote ranking, so sorting cannot change an option's visual identity.
export const POLL_CHART_COLORS = ['#38bdf8', '#34d399', '#fb923c', '#a78bfa', '#f472b6', '#facc15', '#2dd4bf', '#f87171', '#818cf8', '#a3e635', '#e879f9', '#fbbf24', '#60a5fa', '#94a3b8', '#cbd5e1', '#a8a29e', '#71717a'];

const NEUTRAL_COLORS = {
  'Άλλο κόμμα': '#94a3b8',
  'Δεν έχω αποφασίσει': '#a8a29e',
  'Λευκό / Άκυρο': '#cbd5e1',
  'Αποχή': '#71717a',
};

export function getPollOptionColor(poll, option, index) {
  if (poll.useCustomColors) return option.color || '#3b82f6';
  if (poll.purpose === 'voting_intention') {
    const partyColor = getPartyColor(option.text);
    if (partyColor) return partyColor;
    if (NEUTRAL_COLORS[option.text]) return NEUTRAL_COLORS[option.text];
  }
  return POLL_CHART_COLORS[index % POLL_CHART_COLORS.length];
}
