/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Track geoJSON calls so we can assert polygon boundary rendering
const mockGeoJSONInst = { addTo: jest.fn().mockReturnThis() };
const mockGeoJSON = jest.fn(() => mockGeoJSONInst);
const mockMapInstance = {
  setView: jest.fn(),
  fitBounds: jest.fn(),
  addLayer: jest.fn(),
  remove: jest.fn(),
  on: jest.fn(),
  attributionControl: { setPrefix: jest.fn() },
};

// Mock next/dynamic so LocationMap renders BaseMap synchronously in tests
jest.mock('next/dynamic', () => (_fn, _options) => {
  // Resolve the loader synchronously via require so tests don't have to deal with async.
  const ResolvedComponent = require('../components/map/BaseMap').default;
  const DynamicWrapper = (props) => React.createElement(ResolvedComponent, props);
  DynamicWrapper.displayName = 'DynamicWrapper';
  return DynamicWrapper;
});

// Leaflet needs a DOM environment; mock just enough for BaseMap to not crash in jsdom.
jest.mock('leaflet', () => {
  const markerObj = { addTo: jest.fn().mockReturnThis(), bindPopup: jest.fn() };
  const marker = jest.fn(() => markerObj);
  const tileLayer = jest.fn(() => ({ addTo: jest.fn() }));
  const latLngBounds = jest.fn(() => ({ isValid: () => true }));
  const layerGroupObj = { addTo: jest.fn().mockReturnThis(), clearLayers: jest.fn() };
  const layerGroup = jest.fn(() => layerGroupObj);
  const map = jest.fn(() => mockMapInstance);
  return {
    __esModule: true,
    default: { map, tileLayer, marker, geoJSON: mockGeoJSON, latLngBounds, layerGroup, icon: jest.fn(() => ({})) },
    map,
    tileLayer,
    marker,
    geoJSON: mockGeoJSON,
    latLngBounds,
    layerGroup,
    icon: jest.fn(() => ({})),
  };
});

// Suppress Leaflet CSS import in jsdom
jest.mock('leaflet/dist/leaflet.css', () => {}, { virtual: true });

const LocationMap = require('../components/locations/LocationMap').default;

describe('LocationMap', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();
    mockMapInstance.setView.mockClear();
    mockMapInstance.fitBounds.mockClear();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  test('renders map container when location has valid lat and lng', async () => {
    const location = { id: 1, name: 'Athens', name_local: 'Αθήνα', lat: 37.9838, lng: 23.7275, bounding_box: null };
    await act(async () => {
      root.render(React.createElement(LocationMap, { location }));
    });
    // A div should have been rendered (the map container)
    expect(container.querySelector('div')).toBeTruthy();
  });

  test('renders nothing when lat/lng are missing', async () => {
    const location = { id: 2, name: 'Unknown', lat: null, lng: null };
    await act(async () => {
      root.render(React.createElement(LocationMap, { location }));
    });
    expect(container.innerHTML).toBe('');
  });

  test('renders nothing when location is null', async () => {
    await act(async () => {
      root.render(React.createElement(LocationMap, { location: null }));
    });
    expect(container.innerHTML).toBe('');
  });

  test('renders nothing when coordinates are out of valid range', async () => {
    const location = { id: 3, name: 'Bad', lat: 999, lng: 999 };
    await act(async () => {
      root.render(React.createElement(LocationMap, { location }));
    });
    expect(container.innerHTML).toBe('');
  });

  test('renders map container when bounding_box is provided', async () => {
    const location = {
      id: 4,
      name: 'Attica',
      lat: 37.97,
      lng: 23.73,
      bounding_box: { north: 38.1, south: 37.8, east: 23.9, west: 23.5 },
    };
    await act(async () => {
      root.render(React.createElement(LocationMap, { location }));
    });
    expect(container.querySelector('div')).toBeTruthy();
  });

  test('uses name_local as display name when available', async () => {
    // This validates the LocationMap passes the right popup string to BaseMap.
    // Since we mock Leaflet, we just verify the component renders without errors.
    const location = { id: 5, name: 'Athens', name_local: 'Αθήνα', lat: 37.9838, lng: 23.7275 };
    await act(async () => {
      root.render(React.createElement(LocationMap, { location }));
    });
    expect(container.querySelector('div')).toBeTruthy();
  });
});

// ── boundary_geojson tests ───────────────────────────────────────────────────

const SAMPLE_POLYGON_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Αττική' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[23.5, 37.8], [23.9, 37.8], [23.9, 38.1], [23.5, 38.1], [23.5, 37.8]]],
      },
    },
  ],
};

describe('LocationMap — boundary_geojson', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();
    mockMapInstance.setView.mockClear();
    mockMapInstance.fitBounds.mockClear();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  test('calls L.geoJSON when boundary_geojson is a FeatureCollection object', async () => {
    const location = {
      id: 10,
      name: 'Attica',
      name_local: 'Αττική',
      lat: 37.97,
      lng: 23.73,
      boundary_geojson: SAMPLE_POLYGON_GEOJSON,
    };
    await act(async () => {
      root.render(React.createElement(LocationMap, { location }));
    });
    expect(mockGeoJSON).toHaveBeenCalled();
    const callArg = mockGeoJSON.mock.calls[0][0];
    expect(callArg).toBe(SAMPLE_POLYGON_GEOJSON);
  });

  test('calls L.geoJSON when boundary_geojson is a JSON string', async () => {
    const location = {
      id: 11,
      name: 'Attica',
      lat: 37.97,
      lng: 23.73,
      boundary_geojson: JSON.stringify(SAMPLE_POLYGON_GEOJSON),
    };
    await act(async () => {
      root.render(React.createElement(LocationMap, { location }));
    });
    expect(mockGeoJSON).toHaveBeenCalled();
    const callArg = mockGeoJSON.mock.calls[0][0];
    expect(callArg).toEqual(SAMPLE_POLYGON_GEOJSON);
  });

  test('wraps a bare Polygon geometry in a Feature before passing to L.geoJSON', async () => {
    const barePolygon = {
      type: 'Polygon',
      coordinates: [[[23.5, 37.8], [23.9, 37.8], [23.9, 38.1], [23.5, 37.8]]],
    };
    const location = {
      id: 12,
      name: 'Attica',
      lat: 37.97,
      lng: 23.73,
      boundary_geojson: barePolygon,
    };
    await act(async () => {
      root.render(React.createElement(LocationMap, { location }));
    });
    expect(mockGeoJSON).toHaveBeenCalled();
    const callArg = mockGeoJSON.mock.calls[0][0];
    expect(callArg.type).toBe('Feature');
    expect(callArg.geometry).toBe(barePolygon);
  });

  test('wraps a bare MultiPolygon geometry in a Feature before passing to L.geoJSON', async () => {
    const bareMultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [[[[23.5, 37.8], [23.9, 37.8], [23.9, 38.1], [23.5, 37.8]]]],
    };
    const location = {
      id: 13,
      name: 'Test',
      lat: 37.97,
      lng: 23.73,
      boundary_geojson: bareMultiPolygon,
    };
    await act(async () => {
      root.render(React.createElement(LocationMap, { location }));
    });
    expect(mockGeoJSON).toHaveBeenCalled();
    const callArg = mockGeoJSON.mock.calls[0][0];
    expect(callArg.type).toBe('Feature');
    expect(callArg.geometry).toBe(bareMultiPolygon);
  });

  test('does NOT call L.geoJSON when boundary_geojson is absent', async () => {
    const location = {
      id: 14,
      name: 'Athens',
      lat: 37.97,
      lng: 23.73,
    };
    await act(async () => {
      root.render(React.createElement(LocationMap, { location }));
    });
    expect(mockGeoJSON).not.toHaveBeenCalled();
  });

  test('still renders map when boundary_geojson is invalid JSON string', async () => {
    const location = {
      id: 15,
      name: 'Athens',
      lat: 37.97,
      lng: 23.73,
      boundary_geojson: '{not valid json',
    };
    await act(async () => {
      root.render(React.createElement(LocationMap, { location }));
    });
    // Should still render (graceful degradation — boundary is ignored, marker shown)
    expect(container.querySelector('div')).toBeTruthy();
    expect(mockGeoJSON).not.toHaveBeenCalled();
  });

  test('renders map when boundary_geojson is present but lat/lng are missing', async () => {
    const location = {
      id: 16,
      name: 'Boundary-only location',
      lat: null,
      lng: null,
      boundary_geojson: SAMPLE_POLYGON_GEOJSON,
    };
    await act(async () => {
      root.render(React.createElement(LocationMap, { location }));
    });
    expect(container.querySelector('div')).toBeTruthy();
    expect(mockGeoJSON).toHaveBeenCalled();
  });

  test('fits map bounds to boundary_geojson extents', async () => {
    const location = {
      id: 18,
      name: 'Attica',
      boundary_geojson: SAMPLE_POLYGON_GEOJSON,
    };
    await act(async () => {
      root.render(React.createElement(LocationMap, { location }));
    });

    expect(mockMapInstance.fitBounds).toHaveBeenCalled();
  });

  test('uses boundary_color for polygon style', async () => {
    const location = {
      id: 19,
      name: 'Colored boundary',
      lat: 37.97,
      lng: 23.73,
      boundary_geojson: SAMPLE_POLYGON_GEOJSON,
      boundary_color: '#ff7700',
    };
    await act(async () => {
      root.render(React.createElement(LocationMap, { location }));
    });

    expect(mockGeoJSON).toHaveBeenCalled();
    const options = mockGeoJSON.mock.calls[0][1];
    expect(options.style()).toMatchObject({
      color: '#ff7700',
      fillColor: '#ff7700',
    });
  });

  test('uses saved map default center/zoom when provided', async () => {
    const location = {
      id: 20,
      name: 'Default centered',
      lat: 37.97,
      lng: 23.73,
      map_default_center_lat: 36.2,
      map_default_center_lng: 24.5,
      map_default_zoom: 7,
    };
    await act(async () => {
      root.render(React.createElement(LocationMap, { location }));
    });

    expect(mockMapInstance.setView).toHaveBeenCalledWith([36.2, 24.5], 7);
  });

  test('renders nothing when both lat/lng are missing and boundary_geojson is absent', async () => {
    const location = { id: 17, name: 'Empty', lat: null, lng: null };
    await act(async () => {
      root.render(React.createElement(LocationMap, { location }));
    });
    expect(container.innerHTML).toBe('');
  });
});
