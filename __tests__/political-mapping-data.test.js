const fs = require('fs');
const path = require('path');

const regionsMeta = require('../config/map-data/regions.metadata.json');
const districtsMeta = require('../config/map-data/electoral-districts.metadata.json');

const regionsGeo = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'map-data', 'regions.geojson'), 'utf8')
);
const districtsGeo = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'map-data', 'electoral-districts.geojson'), 'utf8')
);

describe('political mapping data joins', () => {
  test('includes 13 regions and 59 electoral districts', () => {
    expect(regionsMeta.regions).toHaveLength(13);
    expect(districtsMeta.electoralDistricts).toHaveLength(59);
  });

  test('region metadata joins correctly to district metadata by stable IDs', () => {
    const districtIds = new Set(districtsMeta.electoralDistricts.map((district) => district.id));
    const regionIds = new Set(regionsMeta.regions.map((region) => region.id));

    regionsMeta.regions.forEach((region) => {
      expect(Array.isArray(region.districtIds)).toBe(true);
      region.districtIds.forEach((districtId) => {
        expect(districtIds.has(districtId)).toBe(true);
      });
    });

    districtsMeta.electoralDistricts.forEach((district) => {
      expect(regionIds.has(district.regionId)).toBe(true);
    });
  });

  test('region/district GeoJSON features expose stable IDs used by metadata', () => {
    const regionFeatureIds = new Set(regionsGeo.features.map((feature) => feature?.properties?.id));
    const regionMetaIds = new Set(regionsMeta.regions.map((region) => region.id));

    expect(regionFeatureIds.size).toBe(regionMetaIds.size);
    regionMetaIds.forEach((id) => {
      expect(regionFeatureIds.has(id)).toBe(true);
    });

    const districtFeatureIds = new Set(districtsGeo.features.map((feature) => feature?.properties?.id));
    const districtMetaIds = new Set(districtsMeta.electoralDistricts.map((district) => district.id));

    expect(districtFeatureIds.size).toBe(districtMetaIds.size);
    districtMetaIds.forEach((id) => {
      expect(districtFeatureIds.has(id)).toBe(true);
    });

    districtsGeo.features.forEach((feature) => {
      expect(regionMetaIds.has(feature?.properties?.regionId)).toBe(true);
    });
  });
});
