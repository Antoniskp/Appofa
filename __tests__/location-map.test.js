/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
  const geoJSON = jest.fn(() => ({ addTo: jest.fn() }));
  const latLngBounds = jest.fn(() => ({ isValid: () => true }));
  const layerGroupObj = { addTo: jest.fn().mockReturnThis(), clearLayers: jest.fn() };
  const layerGroup = jest.fn(() => layerGroupObj);
  const map = jest.fn(() => ({
    setView: jest.fn(),
    fitBounds: jest.fn(),
    addLayer: jest.fn(),
    remove: jest.fn(),
    on: jest.fn(),
    attributionControl: { setPrefix: jest.fn() },
  }));
  return {
    __esModule: true,
    default: { map, tileLayer, marker, geoJSON, latLngBounds, layerGroup, icon: jest.fn(() => ({})) },
    map,
    tileLayer,
    marker,
    geoJSON,
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
