export function activityScopeLabel(location) {
  if (location?.type === 'country' && (location.code === 'GR' || location.slug === 'greece')) return 'Πανελλαδικά';
  return location?.name_local || location?.name;
}
