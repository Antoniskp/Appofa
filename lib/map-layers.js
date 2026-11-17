export const MAP_LAYERS = ['parliamentarians', 'cameras', 'live', 'news', 'issues', 'polls'];

export function resolveMapLayer(value) {
  if (value === 'political') return 'parliamentarians';
  return MAP_LAYERS.includes(value) ? value : 'parliamentarians';
}

export function mapLayerHref(layer, districtId = '') {
  const params = new URLSearchParams({ layer: layer === 'parliamentarians' ? 'political' : layer });
  if (layer === 'parliamentarians' && districtId) params.set('district', districtId);
  return `/map?${params}`;
}
