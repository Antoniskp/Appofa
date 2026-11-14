/** @jest-environment <rootDir>/jest-jsdom-env.js */
/* global document */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const messages = require('../messages/el.json');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let mockMapProps;
jest.mock('next/dynamic', () => () => function MapStub(props) {
  mockMapProps = props;
  return null;
});
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }) => React.createElement('a', { href }, children) }));
jest.mock('@/lib/api', () => ({
  locationSectionAPI: { getAllCameras: jest.fn() },
  suggestionAPI: { getMapIssues: jest.fn() },
  geoAPI: { searchAddress: jest.fn() },
}));

const { locationSectionAPI, suggestionAPI } = require('@/lib/api');
const Explorer = require('../components/locations/LocationMapExplorer').default;
const location = { id: 5, name: 'Town', lat: 38, lng: 23 };
const cameras = [
  { id: '1:0', label: 'Harbour camera', url: 'https://camera.example/live', isWorking: true,
    sourceLocation: location, mapLocation: { lat: 38.01, lng: 23.02 }, mapLocationSource: 'camera' },
  { id: '1:1', label: 'Unmapped camera', url: 'https://camera.example/other', isWorking: false,
    sourceLocation: location, mapLocation: { lat: null, lng: null } },
];
let container, root;
const render = () => root.render(React.createElement(Explorer, { location }));
const button = text => Array.from(container.querySelectorAll('button')).find(node => node.textContent === text);

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  locationSectionAPI.getAllCameras.mockResolvedValue({ success: true, cameras });
  suggestionAPI.getMapIssues.mockResolvedValue({ success: true, data: [], pagination: { total: 0 } });
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
  jest.useRealTimers();
});

test('camera markers select cards and unmapped cameras keep their stream links', async () => {
  await act(async () => { render(); });
  expect(locationSectionAPI.getAllCameras).toHaveBeenCalledWith({ locationId: location.id });
  expect(mockMapProps.markers.filter(marker => marker.markerType === 'camera')).toEqual([
    expect.objectContaining({ id: 'camera-1:0', lat: 38.01, lng: 23.02, variant: 'explorer' }),
  ]);
  await act(async () => { mockMapProps.onMarkerClick('camera-1:0'); });
  expect(container.querySelector('#map-tab-cameras').getAttribute('aria-selected')).toBe('true');
  expect(container.textContent).toContain(messages.cameras.status_unavailable);
  expect(container.textContent).toContain(messages.cameras.map_unavailable);
  expect(container.textContent).toContain(messages.cameras.pin_source_exact);
  expect(container.querySelector('#map-panel-cameras a').getAttribute('href')).toBe('https://camera.example/live');
  expect(mockMapProps.markers.find(marker => marker.markerType === 'camera').variant).toBe('selected');
  expect(mockMapProps.focusTarget).toBeNull();
  await act(async () => { button(messages.mapExplorer.showOnMap).click(); });
  expect(mockMapProps.focusTarget).toEqual({ lat: 38.01, lng: 23.02, zoom: 16 });
  expect(container.querySelectorAll('#map-panel-cameras button').length).toBe(3);
});

test('camera loading failure can be retried without affecting issue loading', async () => {
  locationSectionAPI.getAllCameras.mockRejectedValueOnce(new Error('Unavailable'));
  await act(async () => { render(); });
  await act(async () => { container.querySelector('#map-tab-cameras').click(); });
  expect(container.querySelector('[role="alert"]').textContent).toContain(messages.mapExplorer.camerasError);
  await act(async () => { button(messages.mapExplorer.retry).click(); });
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.textContent).toContain('Harbour camera');
  expect(locationSectionAPI.getAllCameras).toHaveBeenCalledTimes(2);
});
