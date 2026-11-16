/** @jest-environment <rootDir>/jest-jsdom-env.js */
/* global HTMLElement, document, window, KeyboardEvent */

const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const BaseMap = require('../components/map/BaseMap').default;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

beforeEach(() => {
  jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(640);
  jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(360);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});

test('keeps Leaflet container classes and the basemap when expanding and closing repeatedly', async () => {
  // Use real Leaflet: it adds classes that React must preserve during toggles.
  await act(async () => root.render(React.createElement(BaseMap, {
    center: [38.5, 23.8], zoom: 6, showFullscreenControl: true,
  })));
  const map = container.querySelector('[role="region"]');
  const leafletClasses = [...map.classList].filter(name => name.startsWith('leaflet-'));
  const tiles = map.querySelector('.leaflet-tile-pane');
  expect(leafletClasses).toContain('leaflet-container');
  expect(tiles.querySelectorAll('img.leaflet-tile').length).toBeGreaterThan(0);

  const toggle = container.querySelector('button');
  for (let cycle = 0; cycle < 2; cycle += 1) {
    await act(async () => toggle.click());
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect([...map.classList]).toEqual(expect.arrayContaining(leafletClasses));
    expect(map.querySelector('.leaflet-tile-pane')).toBe(tiles);

    await act(async () => {
      if (cycle === 0) toggle.click();
      else window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelector('[role="region"]')).toBe(map);
    expect([...map.classList]).toEqual(expect.arrayContaining(leafletClasses));
    expect(map.querySelector('.leaflet-tile-pane')).toBe(tiles);
    expect(tiles.querySelectorAll('img.leaflet-tile').length).toBeGreaterThan(0);
  }
});
