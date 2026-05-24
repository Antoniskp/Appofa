/** @jest-environment jsdom */

/**
 * Tests for MapViewportPickerMap — interactive map viewport picker component.
 */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// ── Leaflet mock ─────────────────────────────────────────────────────────────
// Capture event listeners so we can fire them programmatically.
const mockMapListeners = {};
const mockMapInstance = {
  setView: jest.fn(),
  getCenter: jest.fn(() => ({ lat: 38.5, lng: 23.8 })),
  getZoom: jest.fn(() => 7),
  remove: jest.fn(),
  on: jest.fn((event, cb) => { mockMapListeners[event] = cb; }),
  attributionControl: { setPrefix: jest.fn() },
};

jest.mock('leaflet', () => {
  const tileLayer = jest.fn(() => ({ addTo: jest.fn() }));
  const map = jest.fn(() => mockMapInstance);
  return {
    __esModule: true,
    default: { map, tileLayer, icon: jest.fn(() => ({})) },
    map,
    tileLayer,
    icon: jest.fn(() => ({})),
  };
});

jest.mock('leaflet/dist/leaflet.css', () => {}, { virtual: true });

const MapViewportPickerMap = require('../components/map/MapViewportPickerMap').default;

// ── helpers ──────────────────────────────────────────────────────────────────
function renderPicker(props = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('MapViewportPickerMap', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();
    Object.keys(mockMapListeners).forEach(k => delete mockMapListeners[k]);
    mockMapInstance.getCenter.mockReturnValue({ lat: 38.5, lng: 23.8 });
    mockMapInstance.getZoom.mockReturnValue(7);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    document.body.innerHTML = '';
  });

  // ── rendering ──────────────────────────────────────────────────────────────

  test('renders a map container div', async () => {
    await act(async () => {
      root.render(React.createElement(MapViewportPickerMap, { onChange: jest.fn() }));
    });
    expect(container.querySelector('div')).toBeTruthy();
  });

  test('renders the crosshair SVG overlay', async () => {
    await act(async () => {
      root.render(React.createElement(MapViewportPickerMap, { onChange: jest.fn() }));
    });
    expect(container.querySelector('svg')).toBeTruthy();
  });

  test('renders the helper text in Greek', async () => {
    await act(async () => {
      root.render(React.createElement(MapViewportPickerMap, { onChange: jest.fn() }));
    });
    expect(container.textContent).toMatch(/Σύρε/);
  });

  // ── initial view ───────────────────────────────────────────────────────────

  test('initialises map with Greece centre when no coords provided', async () => {
    await act(async () => {
      root.render(React.createElement(MapViewportPickerMap, { onChange: jest.fn() }));
    });
    expect(mockMapInstance.setView).toHaveBeenCalledWith([38.5, 23.8], 7);
  });

  test('initialises map with provided lat/lng/zoom', async () => {
    await act(async () => {
      root.render(
        React.createElement(MapViewportPickerMap, {
          lat: 37.97,
          lng: 23.73,
          zoom: 10,
          onChange: jest.fn(),
        })
      );
    });
    expect(mockMapInstance.setView).toHaveBeenCalledWith([37.97, 23.73], 10);
  });

  test('falls back to default zoom 7 when zoom is out of range', async () => {
    await act(async () => {
      root.render(
        React.createElement(MapViewportPickerMap, {
          lat: 37.97,
          lng: 23.73,
          zoom: 99,
          onChange: jest.fn(),
        })
      );
    });
    expect(mockMapInstance.setView).toHaveBeenCalledWith([37.97, 23.73], 7);
  });

  test('falls back to Greece centre when coordinates are invalid', async () => {
    await act(async () => {
      root.render(
        React.createElement(MapViewportPickerMap, {
          lat: 999,
          lng: 999,
          zoom: 7,
          onChange: jest.fn(),
        })
      );
    });
    expect(mockMapInstance.setView).toHaveBeenCalledWith([38.5, 23.8], 7);
  });

  // ── onChange callback ──────────────────────────────────────────────────────

  test('calls onChange with lat/lng/zoom on moveend', async () => {
    const onChange = jest.fn();
    mockMapInstance.getCenter.mockReturnValue({ lat: 37.97, lng: 23.73 });
    mockMapInstance.getZoom.mockReturnValue(10);

    await act(async () => {
      root.render(
        React.createElement(MapViewportPickerMap, { onChange })
      );
    });

    // Simulate moveend event
    act(() => { mockMapListeners['moveend']?.(); });

    expect(onChange).toHaveBeenCalledWith({ lat: 37.97, lng: 23.73, zoom: 10 });
  });

  test('calls onChange with lat/lng/zoom on zoomend', async () => {
    const onChange = jest.fn();
    mockMapInstance.getCenter.mockReturnValue({ lat: 36.0, lng: 24.0 });
    mockMapInstance.getZoom.mockReturnValue(12);

    await act(async () => {
      root.render(
        React.createElement(MapViewportPickerMap, { onChange })
      );
    });

    act(() => { mockMapListeners['zoomend']?.(); });

    expect(onChange).toHaveBeenCalledWith({ lat: 36.0, lng: 24.0, zoom: 12 });
  });

  test('rounds lat/lng to 6 decimal places in onChange', async () => {
    const onChange = jest.fn();
    mockMapInstance.getCenter.mockReturnValue({ lat: 37.9838123456789, lng: 23.7275987654321 });
    mockMapInstance.getZoom.mockReturnValue(10);

    await act(async () => {
      root.render(React.createElement(MapViewportPickerMap, { onChange }));
    });

    act(() => { mockMapListeners['moveend']?.(); });

    expect(onChange).toHaveBeenCalledWith({
      lat: 37.983812,
      lng: 23.727599,
      zoom: 10,
    });
  });

  // ── Leaflet listener registration ──────────────────────────────────────────

  test('registers moveend and zoomend listeners on the map', async () => {
    await act(async () => {
      root.render(React.createElement(MapViewportPickerMap, { onChange: jest.fn() }));
    });

    const events = mockMapInstance.on.mock.calls.map(c => c[0]);
    expect(events).toContain('moveend');
    expect(events).toContain('zoomend');
  });

  // ── className override ─────────────────────────────────────────────────────

  test('applies custom className to the map container', async () => {
    await act(async () => {
      root.render(
        React.createElement(MapViewportPickerMap, {
          onChange: jest.fn(),
          className: 'h-40 custom-class',
        })
      );
    });
    // The first div inside the component wrapper carries the custom class
    const mapDiv = container.querySelector('.custom-class');
    expect(mapDiv).toBeTruthy();
  });
});
