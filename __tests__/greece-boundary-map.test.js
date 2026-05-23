/** @jest-environment jsdom */

/**
 * Tests for the GreeceBoundaryMap component, the BaseMap polygonLayers extension,
 * and the ExploreLocationsMap prefecture-pills enhancement.
 */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// ── Mocks ────────────────────────────────────────────────────────────────────

// Track calls to geoJSON so we can verify polygon layer creation
const mockGeoJSONLayer = {
  addTo: jest.fn().mockReturnThis(),
  resetStyle: jest.fn(),
  on: jest.fn(),
};
const mockGeoJSON = jest.fn(() => mockGeoJSONLayer);

const mockLayerGroupObj = { addTo: jest.fn().mockReturnThis(), clearLayers: jest.fn() };
const mockLayerGroup = jest.fn(() => mockLayerGroupObj);

const mockMapInstance = {
  setView: jest.fn(),
  fitBounds: jest.fn(),
  addLayer: jest.fn(),
  remove: jest.fn(),
  on: jest.fn(),
  attributionControl: { setPrefix: jest.fn() },
  Browser: { ie: false, opera: false, edge: false },
};

jest.mock('leaflet', () => {
  const markerObj = { addTo: jest.fn().mockReturnThis(), bindPopup: jest.fn() };
  return {
    __esModule: true,
    default: {
      map: jest.fn(() => mockMapInstance),
      tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
      marker: jest.fn(() => markerObj),
      geoJSON: mockGeoJSON,
      latLngBounds: jest.fn(() => ({ isValid: () => true })),
      layerGroup: mockLayerGroup,
      icon: jest.fn(() => ({})),
      Browser: { ie: false, opera: false, edge: false },
    },
    map: jest.fn(() => mockMapInstance),
    tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
    marker: jest.fn(() => markerObj),
    geoJSON: mockGeoJSON,
    latLngBounds: jest.fn(() => ({ isValid: () => true })),
    layerGroup: mockLayerGroup,
    icon: jest.fn(() => ({})),
    Browser: { ie: false, opera: false, edge: false },
  };
});

jest.mock('leaflet/dist/leaflet.css', () => {}, { virtual: true });

// next/dynamic: resolve synchronously
jest.mock('next/dynamic', () => (_fn, _opts) => {
  const resolved = _fn();
  if (resolved && typeof resolved.then === 'function') {
    // Sync-ish: use require to resolve the module path
    return (props) => React.createElement('div', { 'data-testid': 'dynamic-placeholder' });
  }
  const Comp = resolved;
  const Wrapper = (props) => React.createElement(Comp.default || Comp, props);
  Wrapper.displayName = 'DynamicWrapper';
  return Wrapper;
});

// next/link
jest.mock('next/link', () => {
  const Link = ({ href, children, ...rest }) =>
    React.createElement('a', { href, ...rest }, children);
  Link.displayName = 'Link';
  return Link;
});

// Mock fetch for GeoJSON loading (used only when fallback is needed)
const SAMPLE_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'GR-I',
      properties: {
        name: 'Αττική',
        name_en: 'Attica',
        code: 'GR-I',
        capital: 'Αθήνα',
        type: 'periphery',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[22.9, 38.2], [23.0, 38.5], [23.9, 38.4], [22.9, 38.2]]],
      },
    },
  ],
};

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(SAMPLE_GEOJSON),
  })
);

// ── Import components after mocks ────────────────────────────────────────────

const BaseMap = require('../components/map/BaseMap').default;

const {
  normalizeBoundaryGeoJSON,
  buildFeatureCollectionFromLocations,
  locationToFeatures,
} = require('../components/map/GreeceBoundaryMap');

// ── Helpers ──────────────────────────────────────────────────────────────────

async function renderComponent(element) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}

async function cleanup(root, container) {
  await act(async () => { root.unmount(); });
  container.remove();
}

function collectLonLatPairs(node, output = []) {
  if (!Array.isArray(node)) return output;
  if (
    node.length >= 2 &&
    typeof node[0] === 'number' &&
    typeof node[1] === 'number'
  ) {
    output.push([node[0], node[1]]);
    return output;
  }
  node.forEach((child) => collectLonLatPairs(child, output));
  return output;
}

// Sample prefecture Location objects with boundary_geojson
const SAMPLE_PREFECTURE_POLYGON = {
  type: 'Polygon',
  coordinates: [[[22.9, 38.2], [23.0, 38.5], [23.9, 38.4], [22.9, 38.2]]],
};

const SAMPLE_PREFECTURE = {
  id: 1,
  name: 'Attica',
  name_local: 'Αττική',
  slug: 'attiki',
  code: 'GR-I',
  type: 'prefecture',
  boundary_geojson: SAMPLE_PREFECTURE_POLYGON,
};

const SAMPLE_PREFECTURE_NO_BOUNDARY = {
  id: 2,
  name: 'Crete',
  name_local: 'Κρήτη',
  slug: 'kriti',
  code: 'GR-M',
  type: 'prefecture',
  boundary_geojson: null,
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('BaseMap — polygonLayers prop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders a map container div', async () => {
    const { container, root } = await renderComponent(
      React.createElement(BaseMap, {
        center: [38.5, 23.8],
        zoom: 6,
        polygonLayers: [],
      })
    );
    expect(container.querySelector('div')).toBeTruthy();
    await cleanup(root, container);
  });

  test('calls L.geoJSON when polygonLayers is non-empty', async () => {
    const layer = {
      id: 'test-layer',
      geojson: SAMPLE_GEOJSON,
      fitBoundsOnClick: true,
      getTooltip: (p) => p.name,
      getPopup: (p) => `<b>${p.name}</b>`,
    };

    const { container, root } = await renderComponent(
      React.createElement(BaseMap, {
        center: [38.5, 23.8],
        zoom: 6,
        polygonLayers: [layer],
      })
    );

    // geoJSON should have been called with the feature collection
    expect(mockGeoJSON).toHaveBeenCalled();
    const callArg = mockGeoJSON.mock.calls[0][0];
    expect(callArg).toBe(SAMPLE_GEOJSON);

    await cleanup(root, container);
  });

  test('passes style and onEachFeature options to L.geoJSON', async () => {
    const customStyle = { color: '#ff0000', weight: 3, fillOpacity: 0.5 };
    const layer = {
      id: 'styled-layer',
      geojson: SAMPLE_GEOJSON,
      style: customStyle,
    };

    const { container, root } = await renderComponent(
      React.createElement(BaseMap, {
        center: [38.5, 23.8],
        zoom: 6,
        polygonLayers: [layer],
      })
    );

    expect(mockGeoJSON).toHaveBeenCalled();
    const options = mockGeoJSON.mock.calls[0][1];
    expect(typeof options.style).toBe('function');
    expect(typeof options.onEachFeature).toBe('function');

    await cleanup(root, container);
  });

  test('does not crash when polygonLayers contains a null entry', async () => {
    const { container, root } = await renderComponent(
      React.createElement(BaseMap, {
        center: [38.5, 23.8],
        zoom: 6,
        polygonLayers: [null, undefined],
      })
    );
    expect(container.querySelector('div')).toBeTruthy();
    await cleanup(root, container);
  });

  test('backward-compat: still renders when only overlays are provided', async () => {
    const { container, root } = await renderComponent(
      React.createElement(BaseMap, {
        center: [38.5, 23.8],
        zoom: 6,
        overlays: [SAMPLE_GEOJSON],
      })
    );
    expect(container.querySelector('div')).toBeTruthy();
    await cleanup(root, container);
  });
});

describe('normalizeBoundaryGeoJSON', () => {
  test('returns FeatureCollection unchanged', () => {
    const fc = { type: 'FeatureCollection', features: [] };
    expect(normalizeBoundaryGeoJSON(fc, 'Test')).toBe(fc);
  });

  test('returns Feature unchanged', () => {
    const f = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: {} };
    expect(normalizeBoundaryGeoJSON(f, 'Test')).toBe(f);
  });

  test('wraps bare Polygon in a Feature with displayName', () => {
    const polygon = { type: 'Polygon', coordinates: [[[0, 0], [1, 1], [0, 0]]] };
    const result = normalizeBoundaryGeoJSON(polygon, 'Αττική');
    expect(result.type).toBe('Feature');
    expect(result.geometry).toBe(polygon);
    expect(result.properties.name).toBe('Αττική');
  });

  test('wraps bare MultiPolygon in a Feature with displayName', () => {
    const mp = { type: 'MultiPolygon', coordinates: [[[[0, 0], [1, 1], [0, 0]]]] };
    const result = normalizeBoundaryGeoJSON(mp, 'Κρήτη');
    expect(result.type).toBe('Feature');
    expect(result.geometry).toBe(mp);
    expect(result.properties.name).toBe('Κρήτη');
  });

  test('returns null for unsupported geometry type', () => {
    const point = { type: 'Point', coordinates: [23.7, 38.0] };
    expect(normalizeBoundaryGeoJSON(point, 'Test')).toBeNull();
  });

  test('returns null for null input', () => {
    expect(normalizeBoundaryGeoJSON(null, 'Test')).toBeNull();
  });

  test('returns null for invalid JSON string', () => {
    expect(normalizeBoundaryGeoJSON('not-json', 'Test')).toBeNull();
  });

  test('parses a JSON string and normalises it', () => {
    const polygon = { type: 'Polygon', coordinates: [[[0, 0], [1, 1], [0, 0]]] };
    const result = normalizeBoundaryGeoJSON(JSON.stringify(polygon), 'Αττική');
    expect(result.type).toBe('Feature');
    expect(result.properties.name).toBe('Αττική');
  });
});

describe('locationToFeatures', () => {
  test('produces a single Feature from a bare Polygon boundary', () => {
    const features = locationToFeatures(SAMPLE_PREFECTURE);
    expect(features).toHaveLength(1);
    expect(features[0].type).toBe('Feature');
    expect(features[0].properties.name).toBe('Αττική'); // name_local preferred
    expect(features[0].properties.slug).toBe('attiki');
    expect(features[0].properties.code).toBe('GR-I');
  });

  test('returns empty array when boundary_geojson is null', () => {
    expect(locationToFeatures(SAMPLE_PREFECTURE_NO_BOUNDARY)).toHaveLength(0);
  });

  test('returns empty array when boundary_geojson is an invalid JSON string', () => {
    const loc = { ...SAMPLE_PREFECTURE, boundary_geojson: 'not-valid-json' };
    expect(locationToFeatures(loc)).toHaveLength(0);
  });

  test('expands a FeatureCollection boundary into multiple features with location props', () => {
    const fc = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: { island: 'A' } },
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: { island: 'B' } },
      ],
    };
    const loc = { id: 5, name: 'Νότιο Αιγαίο', name_local: null, slug: 'notio-aigaio', code: 'GR-L', boundary_geojson: fc };
    const features = locationToFeatures(loc);
    expect(features).toHaveLength(2);
    features.forEach((f) => {
      expect(f.properties.name).toBe('Νότιο Αιγαίο'); // name used when name_local is null
      expect(f.properties.slug).toBe('notio-aigaio');
    });
    // Original FeatureCollection properties are preserved
    expect(features[0].properties.island).toBe('A');
    expect(features[1].properties.island).toBe('B');
  });

  test('uses name (not name_local) when name_local is absent', () => {
    const loc = { ...SAMPLE_PREFECTURE, name_local: null };
    const features = locationToFeatures(loc);
    expect(features[0].properties.name).toBe('Attica');
    expect(features[0].properties.name_en).toBe('Attica');
  });
});

describe('buildFeatureCollectionFromLocations', () => {
  test('returns null when no locations have boundary_geojson', () => {
    expect(buildFeatureCollectionFromLocations([SAMPLE_PREFECTURE_NO_BOUNDARY])).toBeNull();
  });

  test('returns null for empty array', () => {
    expect(buildFeatureCollectionFromLocations([])).toBeNull();
  });

  test('builds a FeatureCollection from prefectures with boundary_geojson', () => {
    const result = buildFeatureCollectionFromLocations([SAMPLE_PREFECTURE, SAMPLE_PREFECTURE_NO_BOUNDARY]);
    expect(result).not.toBeNull();
    expect(result.type).toBe('FeatureCollection');
    expect(result.features).toHaveLength(1);
    expect(result.features[0].properties.slug).toBe('attiki');
  });

  test('merges multiple location boundaries into one collection', () => {
    const loc2 = {
      id: 3,
      name: 'Crete',
      name_local: 'Κρήτη',
      slug: 'kriti',
      code: 'GR-M',
      boundary_geojson: { type: 'Polygon', coordinates: [[[24, 35], [25, 35.5], [24, 35]]] },
    };
    const result = buildFeatureCollectionFromLocations([SAMPLE_PREFECTURE, loc2]);
    expect(result.features).toHaveLength(2);
  });
});

describe('greece-regions.geojson schema', () => {
  let geoData;

  beforeAll(() => {
    // Read the file directly to verify schema
    const fs = require('fs');
    const path = require('path');
    const raw = fs.readFileSync(
      path.join(__dirname, '..', 'public', 'data', 'greece-regions.geojson'),
      'utf8'
    );
    geoData = JSON.parse(raw);
  });

  test('is a valid GeoJSON FeatureCollection', () => {
    expect(geoData.type).toBe('FeatureCollection');
    expect(Array.isArray(geoData.features)).toBe(true);
  });

  test('has exactly 13 features (one per periphery)', () => {
    expect(geoData.features).toHaveLength(13);
  });

  test('every feature has required properties', () => {
    geoData.features.forEach((feature) => {
      expect(feature.type).toBe('Feature');
      expect(feature.properties).toBeDefined();
      expect(typeof feature.properties.name).toBe('string');
      expect(typeof feature.properties.code).toBe('string');
      expect(typeof feature.properties.capital).toBe('string');
      expect(['Polygon', 'MultiPolygon']).toContain(feature.geometry.type);
    });
  });

  test('all codes are unique', () => {
    const codes = geoData.features.map((f) => f.properties.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  test('all GR-* region codes are present', () => {
    const expectedCodes = ['GR-A', 'GR-B', 'GR-C', 'GR-D', 'GR-E', 'GR-F', 'GR-G', 'GR-H', 'GR-I', 'GR-J', 'GR-K', 'GR-L', 'GR-M'];
    const codes = geoData.features.map((f) => f.properties.code);
    expectedCodes.forEach((code) => {
      expect(codes).toContain(code);
    });
  });

  test('Attica feature exists and contains Athens coordinates', () => {
    const attica = geoData.features.find((f) => f.properties.code === 'GR-I');
    expect(attica).toBeDefined();
    expect(attica.properties.capital).toContain('Αθήνα');
    // Athens is at ~23.7°E, 38.0°N — verify the polygon roughly covers this area
    // (simplified check: at least some coordinate is within ±1° of Athens)
    const lonLatPairs = collectLonLatPairs(attica.geometry.coordinates);
    const lngs = lonLatPairs.map(([lng]) => lng);
    const lats = lonLatPairs.map(([, lat]) => lat);
    const athensLng = 23.73;
    const athensLat = 37.98;
    const withinLng = lngs.some((lng) => Math.abs(lng - athensLng) < 0.8);
    const withinLat = lats.some((lat) => Math.abs(lat - athensLat) < 0.8);
    expect(withinLng).toBe(true);
    expect(withinLat).toBe(true);
  });

  test('Crete feature is in southern Greece latitudes', () => {
    const crete = geoData.features.find((f) => f.properties.code === 'GR-M');
    expect(crete).toBeDefined();
    // All coordinates should be south of 36°N
    const lonLatPairs = collectLonLatPairs(crete.geometry.coordinates);
    const lats = lonLatPairs.map(([, lat]) => lat);
    lats.forEach((lat) => {
      expect(lat).toBeLessThan(36);
    });
  });
});

describe('ExploreLocationsMap — prefecture pills', () => {
  const ExploreLocationsMap = require('../components/locations/ExploreLocationsMap').default;

  test('renders prefecture pills for each prefecture with a slug', async () => {
    const prefectures = [
      { id: 1, name: 'Attica', name_local: 'Αττική', slug: 'attiki', code: 'GR-I', boundary_geojson: null },
      { id: 2, name: 'Crete', name_local: 'Κρήτη', slug: 'kriti', code: 'GR-M', boundary_geojson: null },
    ];
    const { container, root } = await renderComponent(
      React.createElement(ExploreLocationsMap, { prefectures, loading: false })
    );

    const links = container.querySelectorAll('a');
    const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/locations/attiki');
    expect(hrefs).toContain('/locations/kriti');

    await cleanup(root, container);
  });

  test('renders pills with name_local when available', async () => {
    const prefectures = [
      { id: 1, name: 'Attica', name_local: 'Αττική', slug: 'attiki', code: 'GR-I', boundary_geojson: null },
    ];
    const { container, root } = await renderComponent(
      React.createElement(ExploreLocationsMap, { prefectures, loading: false })
    );

    expect(container.textContent).toContain('Αττική');
    await cleanup(root, container);
  });

  test('does not render pills while loading', async () => {
    const prefectures = [
      { id: 1, name: 'Attica', name_local: 'Αττική', slug: 'attiki', code: 'GR-I', boundary_geojson: null },
    ];
    const { container, root } = await renderComponent(
      React.createElement(ExploreLocationsMap, { prefectures, loading: true })
    );

    // Links to location pages should not appear during loading
    const locationLinks = Array.from(container.querySelectorAll('a'))
      .filter((a) => a.getAttribute('href')?.startsWith('/locations/'));
    expect(locationLinks).toHaveLength(0);

    await cleanup(root, container);
  });

  test('renders no pills when prefectures array is empty', async () => {
    const { container, root } = await renderComponent(
      React.createElement(ExploreLocationsMap, { prefectures: [], loading: false })
    );
    const locationLinks = Array.from(container.querySelectorAll('a'))
      .filter((a) => a.getAttribute('href')?.startsWith('/locations/'));
    expect(locationLinks).toHaveLength(0);
    await cleanup(root, container);
  });

  test('falls back to /locations href when prefecture has no slug', async () => {
    const prefectures = [
      { id: 1, name: 'Unknown', name_local: null, slug: null, code: 'GR-X', boundary_geojson: null },
    ];
    const { container, root } = await renderComponent(
      React.createElement(ExploreLocationsMap, { prefectures, loading: false })
    );

    const links = container.querySelectorAll('a[href="/locations"]');
    expect(links.length).toBeGreaterThan(0);
    await cleanup(root, container);
  });
});
