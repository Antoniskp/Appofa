export function validMapCoordinate(value, min, max) {
  return value !== null && value !== undefined && value !== ''
    && Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max;
}

export function hasMapPoint(item, latKey = 'lat', lngKey = 'lng') {
  return validMapCoordinate(item?.[latKey], -90, 90) && validMapCoordinate(item?.[lngKey], -180, 180);
}

export function normalizeMapSearch(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
}

export function pointInMapBounds(lat, lng, bounds) {
  if (!bounds) return true;
  const inLongitude = bounds.east - bounds.west >= 360 || (bounds.west <= bounds.east
    ? Number(lng) >= bounds.west && Number(lng) <= bounds.east
    : Number(lng) >= bounds.west || Number(lng) <= bounds.east);
  return Number(lat) >= bounds.south && Number(lat) <= bounds.north && inLongitude;
}

export function normalizeMapBoundary(raw, name = '') {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data) return null;
    const features = data.type === 'FeatureCollection' ? data.features
      : data.type === 'Feature' ? [data] : [{ type: 'Feature', geometry: data, properties: { name } }];
    const valid = features.filter(feature => ['Polygon', 'MultiPolygon'].includes(feature?.geometry?.type)
      && Array.isArray(feature.geometry.coordinates) && feature.geometry.coordinates.length);
    return valid.length ? { type: 'FeatureCollection', features: valid } : null;
  } catch { return null; }
}

export function mapGeometryBounds(geojson) {
  let north = -Infinity, south = Infinity, east = -Infinity, west = Infinity;
  function visit(node) {
    if (!Array.isArray(node)) return;
    if (typeof node[0] === 'number' && typeof node[1] === 'number') {
      if (!Number.isFinite(node[0]) || !Number.isFinite(node[1])) return;
      west = Math.min(west, node[0]); east = Math.max(east, node[0]);
      south = Math.min(south, node[1]); north = Math.max(north, node[1]);
    } else node.forEach(visit);
  }
  const features = geojson?.type === 'FeatureCollection' ? geojson.features : [geojson];
  features.forEach(feature => visit(feature?.geometry?.coordinates));
  return Number.isFinite(north) ? { north, south, east, west } : null;
}

// A world polygon with the area's rings cut out. Preserve islands and interior holes.
export function outsideBoundaryMask(geojson) {
  const polygons = (geojson?.features || []).flatMap(feature => feature.geometry.type === 'Polygon'
    ? [feature.geometry.coordinates] : feature.geometry.coordinates);
  if (!polygons.length) return null;
  return { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: [
    [[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]], ...polygons.map(polygon => polygon[0])],
    ...polygons.flatMap(polygon => polygon.slice(1).map(ring => [ring])),
  ] } };
}
