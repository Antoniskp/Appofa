/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const t = require('../messages/el.json').homeMap;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let mockCanvas;
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href, ...props }) => React.createElement('a', { href, ...props }, children) }));
jest.mock('next/dynamic', () => () => function CanvasStub(props) { mockCanvas = props; return null; });
jest.mock('@/lib/api/locations', () => ({ locationAPI: { getMapActivity: jest.fn() } }));
const { locationAPI } = require('@/lib/api/locations');
const Explorer = require('../components/locations/ExploreLocationsMap').default;
const region = { id: 2, name: 'Attica', slug: 'attica', lat: 38, lng: 23.7, type: 'prefecture', totals: { issues: 2, polls: 1, cameras: 1 } };
const town = { id: 3, name: 'Athens', slug: 'athens', lat: 38, lng: 23.7, type: 'municipality' };
const view = { north: 38.1, south: 37.9, east: 23.9, west: 23.6 };
let container, root;
const button = text => Array.from(container.querySelectorAll('button')).find(node => node.textContent === text);
const render = async props => { await act(async () => root.render(React.createElement(Explorer, { prefectures: [region], ...props }))); };
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks();
  locationAPI.getMapActivity.mockImplementation(async params => params.search ? { success: true, locations: [town] } : {
    success: true, location: params.locationId ? town : { id: 1, name: 'Greece', slug: 'greece' },
    areas: params.locationId ? [] : [region], totals: region.totals,
    items: params.detail === 'true' ? [{ id: 'issue-1', kind: 'issues', title: 'Broken light', lat: 38, lng: 23.7, href: '/suggestions/1' }] : [],
    pagination: { total: params.detail === 'true' ? 1 : 0, totalPages: 1 },
  });
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); jest.useRealTimers(); delete global.IntersectionObserver; });

test('area list and map hover highlight each other and selection opens an area preview', async () => {
  await render();
  const area = container.querySelector('ul[aria-label] button');
  await act(async () => area.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })));
  expect(mockCanvas.hoveredId).toBe('area-2');
  await act(async () => mockCanvas.onHover(null));
  expect(mockCanvas.hoveredId).toBeNull();
  await act(async () => mockCanvas.onHover('area-2'));
  expect(area.className).toContain('border-copper');
  await act(async () => mockCanvas.onMarkerClick('area-3'));
  expect(locationAPI.getMapActivity).toHaveBeenLastCalledWith(expect.objectContaining({ locationId: 3 }));
  expect(container.querySelector('a[href="/locations/athens"]')).toBeTruthy();
  expect(mockCanvas.focusTarget).toEqual({ lat: 38, lng: 23.7, zoom: 12 });
});
test('fetches pins for the viewport, selects a result without moving the map, and switches layers', async () => {
  await render({ homeLocationId: 3 });
  await act(async () => mockCanvas.onViewportChange(view));
  await act(async () => jest.advanceTimersByTime(400));
  expect(locationAPI.getMapActivity).toHaveBeenLastCalledWith(expect.objectContaining({ detail: 'true', ...view }));
  await act(async () => mockCanvas.onMarkerClick('issue-1'));
  expect(container.querySelector('[data-home-map-item] button').getAttribute('aria-pressed')).toBe('true');
  expect(mockCanvas.focusTarget).toBeNull();
  await act(async () => button(t.showOnMap).click());
  expect(mockCanvas.focusTarget).toEqual({ lat: 38, lng: 23.7, zoom: 15 });
  await act(async () => button(t.cameras).click());
  expect(locationAPI.getMapActivity).toHaveBeenLastCalledWith(expect.objectContaining({ layer: 'cameras' }));
  await act(async () => button(t.myArea).click());
  expect(locationAPI.getMapActivity).toHaveBeenLastCalledWith(expect.objectContaining({ locationId: 3 }));
  await act(async () => button(t.wholeCountry).click());
  expect(locationAPI.getMapActivity).toHaveBeenLastCalledWith(expect.objectContaining({ locationId: undefined }));
});
test('waits until near the viewport before loading map data', async () => {
  let observe;
  global.IntersectionObserver = class { constructor(callback) { observe = callback; } observe() {} disconnect() {} };
  await render();
  expect(locationAPI.getMapActivity).not.toHaveBeenCalled();
  await act(async () => observe([{ isIntersecting: true }]));
  expect(locationAPI.getMapActivity).toHaveBeenCalledTimes(1);
});
test('failed activity shows a retry instead of a false zero count', async () => {
  locationAPI.getMapActivity.mockRejectedValueOnce(new Error('offline'));
  await render();
  expect(container.querySelector('[role="alert"]').textContent).toContain(t.error);
  expect(container.querySelector('aside').textContent).toContain('…');
  await act(async () => button(t.retry).click());
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.textContent).toContain('Attica');
});

test('MP mode avoids sending an unsupported activity layer and can return to issues', async () => {
  await render();
  locationAPI.getMapActivity.mockClear();
  await act(async () => button(t.political).click());
  expect(locationAPI.getMapActivity).not.toHaveBeenCalled();
  expect(container.querySelector('input[type="search"]')).toBeNull();
  await act(async () => button(t.issues).click());
  expect(locationAPI.getMapActivity).toHaveBeenLastCalledWith(expect.objectContaining({ layer: 'issues' }));
  expect(container.querySelector('input[type="search"]')).toBeTruthy();
});

test('political widget reuses the map with a layer link and no unrelated activity requests', async () => {
  await render({ initialLayer: 'parliamentarians', showLayerControls: false, showMapLink: true });
  expect(locationAPI.getMapActivity).not.toHaveBeenCalled();
  expect(container.querySelector('[role="group"]')).toBeNull();
  expect(container.querySelector('a[href="/map?layer=political"]')).toBeTruthy();
  await act(async () => mockCanvas.onDistrictChange('district-athens-a'));
  expect(container.querySelector('a[href="/map?layer=political&district=district-athens-a"]')).toBeTruthy();
});
