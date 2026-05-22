/** @jest-environment jsdom */

/**
 * Tests for the GreeceBoundaryMap component and the BaseMap polygonLayers extension.
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

// Mock fetch for GeoJSON loading
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
    const coords = attica.geometry.coordinates.flat(2);
    const lngs = coords.filter((_, i) => i % 2 === 0);
    const lats = coords.filter((_, i) => i % 2 === 1);
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
    const coords = crete.geometry.coordinates.flat(2);
    const lats = coords.filter((_, i) => i % 2 === 1);
    lats.forEach((lat) => {
      expect(lat).toBeLessThan(36);
    });
  });
});
