const { resolveMapLayer, mapLayerHref } = require('../lib/map-layers');

test('map URLs support every public layer and normalize invalid query values', () => {
  for (const layer of ['cameras', 'live', 'news', 'issues', 'polls']) expect(resolveMapLayer(layer)).toBe(layer);
  expect(resolveMapLayer('political')).toBe('parliamentarians');
  expect(resolveMapLayer(['news', 'live'])).toBe('parliamentarians');
  expect(resolveMapLayer('unknown')).toBe('parliamentarians');
  expect(mapLayerHref('parliamentarians', 'district-athens-a')).toBe('/map?layer=political&district=district-athens-a');
});
