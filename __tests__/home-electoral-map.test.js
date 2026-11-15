/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const text = require('../messages/el.json').homeMap;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let mockMap;
jest.mock('@/components/map/BaseMap', () => ({ __esModule: true, default: props => { mockMap = props; return null; } }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href, ...props }) => React.createElement('a', { href, ...props }, children) }));
jest.mock('@/lib/api/persons', () => ({ personAPI: { getAll: jest.fn() } }));
const { personAPI } = require('@/lib/api/persons');
const ElectoralMap = require('../components/locations/HomeElectoralMap').default;
const { getProfileDistrictId } = require('../lib/parliamentary-districts');
const feature = { type: 'Feature', properties: { id: 'district-athens-a', name: 'Α΄ Αθηνών' },
  geometry: { type: 'Polygon', coordinates: [[[23.7, 37.9], [23.8, 37.9], [23.8, 38], [23.7, 37.9]]] } };
const profiles = [
  { id: 1, slug: 'test-athens-mp', firstNameNative: 'Άννα', lastNameNative: 'Δοκιμή', constituency: { slug: 'gr-electoral-athens-a' }, politicalAffiliations: [{ organization: { name: 'Κόμμα Δοκιμής' } }] },
  { id: 2, slug: 'test-state-mp', firstNameNative: 'Νίκος', lastNameNative: 'Επικρατείας', constituency: { slug: 'gr-electoral-state' } },
];
let container, root;
const button = label => Array.from(container.querySelectorAll('button')).find(node => node.textContent.includes(label));
const render = async () => { await act(async () => root.render(React.createElement(ElectoralMap, { tileMode: 'light', onTileModeChange: jest.fn() }))); };
const search = async value => {
  const input = container.querySelector('input');
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ type: 'FeatureCollection', features: [feature] }) });
  personAPI.getAll.mockImplementation(async ({ page }) => ({ success: true, data: { profiles: [profiles[page - 1]], pagination: { totalPages: 2 } } }));
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); delete global.fetch; });

test('loads every page and connects district polygons, list hover and MP profile links', async () => {
  await render();
  expect(personAPI.getAll).toHaveBeenNthCalledWith(2, { position: 'parliamentary', page: 2, limit: 100 });
  const controls = { highlight: jest.fn(), unhighlight: jest.fn() };
  mockMap.polygonLayers[0].onLayerInit(controls);
  await act(async () => button('Α΄ Αθηνών').dispatchEvent(new MouseEvent('mouseover', { bubbles: true })));
  expect(controls.highlight).toHaveBeenCalledWith('district-athens-a');
  await act(async () => mockMap.polygonLayers[0].onFeatureHover(feature));
  expect(button('Α΄ Αθηνών').className).toContain('border-copper');
  await act(async () => mockMap.polygonLayers[0].onFeatureClick(feature));
  expect(container.querySelector('h3').textContent).toBe('Α΄ Αθηνών');
  expect(container.querySelector('a[href="/persons/test-athens-mp"]').textContent).toContain('Κόμμα Δοκιμής');
  expect(container.querySelector('a[href="/persons/test-state-mp"]')).toBeNull();
  expect(mockMap.focusTarget.bounds).toEqual({ north: 38, south: 37.9, east: 23.8, west: 23.7 });
});

test('searches names and parties without accents and supports nationwide MPs without a polygon', async () => {
  await render();
  await search('αννα');
  expect(container.querySelectorAll('ul button')).toHaveLength(1);
  await act(async () => button('Α΄ Αθηνών').click());
  expect(container.querySelector('a[href="/persons/test-athens-mp"]')).toBeTruthy();
  await search('κομμα δοκιμης');
  expect(container.querySelectorAll('ul button')).toHaveLength(1);
  await search('');
  await act(async () => {
    const select = container.querySelector('select'); select.value = 'district-state';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(container.textContent).toContain(text.electoral.stateHint);
  expect(container.querySelector('a[href="/persons/test-state-mp"]')).toBeTruthy();
  expect(mockMap.focusTarget).toBeNull();
  await act(async () => button(text.wholeCountry).click());
  expect(container.querySelectorAll('ul button')).toHaveLength(60);
});

test('a failed page shows an error instead of partial counts and can be retried', async () => {
  personAPI.getAll.mockResolvedValueOnce({ success: true, data: { profiles: [profiles[0]], pagination: { totalPages: 2 } } })
    .mockRejectedValueOnce(new Error('offline'));
  await render();
  expect(container.querySelector('[role="alert"]').textContent).toContain(text.electoral.error);
  expect(container.querySelector('ul')).toBeNull();
  await act(async () => button(text.retry).click());
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.querySelectorAll('ul button')).toHaveLength(60);
});

test('uses curated assignments before stale profile constituencies', () => {
  expect(getProfileDistrictId({ slug: 'dimitris-avramopoulos', constituency: { slug: 'gr-electoral-athens-a' } })).toBe('district-ilia');
  expect(getProfileDistrictId({ slug: 'unknown', constituency: { slug: 'gr-electoral-state' } })).toBe('district-state');
  expect(getProfileDistrictId({ slug: 'unknown' })).toBeNull();
});
