/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const fs = require('node:fs');
const path = require('node:path');
const text = require('../messages/el.json').politicalWidget;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let mockMap;
jest.mock('next-intl', () => ({ useTranslations: namespace => (key, values = {}) => {
  const messages = require('../messages/el.json');
  const label = key.split('.').reduce((value, part) => value?.[part], messages[namespace]);
  return String(label || key).replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
} }));
jest.mock('next/dynamic', () => () => props => { mockMap = props; return null; });
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href, ...props }) => React.createElement('a', { href, ...props }, children) }));
jest.mock('@/lib/political-map-data', () => ({ ...jest.requireActual('@/lib/political-map-data'), loadParliamentarians: jest.fn(), loadPoliticalCandidates: jest.fn() }));
jest.mock('@/lib/api/locations', () => ({ electoralDistrictAPI: { getMunicipalityDistricts: jest.fn() }, locationAPI: { getMapActivity: jest.fn() } }));
const { loadParliamentarians, loadPoliticalCandidates } = require('@/lib/political-map-data');
const { electoralDistrictAPI, locationAPI } = require('@/lib/api/locations');
const Widget = require('../components/political/PoliticalMapWidget').default;
const feature = { type: 'Feature', properties: { id: 'district-athens-a', name: 'Α΄ Αθηνών' }, geometry: { type: 'Polygon', coordinates: [[[23.7, 37.9], [23.8, 37.9], [23.8, 38], [23.7, 37.9]]] } };
let container, root;
const button = label => Array.from(container.querySelectorAll('button')).find(node => node.textContent.includes(label));
const render = async props => { await act(async () => root.render(React.createElement(Widget, props))); };
const choose = async value => { await act(async () => {
  const select = container.querySelector('select'); select.value = value; select.dispatchEvent(new Event('change', { bubbles: true }));
}); };
beforeEach(() => {
  jest.clearAllMocks(); mockMap = undefined;
  window.matchMedia = jest.fn(() => ({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  loadParliamentarians.mockResolvedValue([1, 2, 3].map(id => ({ id, slug: `mp-${id}`, firstNameNative: `MP ${id}`, constituency: { slug: 'gr-electoral-athens-a' } })));
  loadPoliticalCandidates.mockResolvedValue([1, 2, 3].map(id => ({ id, districtId: 'district-athens-a', electionCycle: id === 2 ? '2023' : '2027',
    consultationCommitment: id === 1 ? 'I will consult residents monthly.' : null,
    candidate: { id: 10 + id, username: `candidate-${id}`, firstNameNative: `Candidate ${id}` } })));
  electoralDistrictAPI.getMunicipalityDistricts.mockResolvedValue({ success: true, districts: [{ slug: 'gr-electoral-athens-a' }] });
  locationAPI.getMapActivity.mockResolvedValue({ success: true, locations: [] });
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ type: 'FeatureCollection', features: [feature] }) });
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); delete global.fetch; });

test('shows two MPs and two candidates together with cycle labels and honest commitment states', async () => {
  await render();
  expect(container.textContent).toContain(text.promptTitle);
  await choose('district-athens-a');
  expect(container.querySelectorAll('a[href^="/persons/"]')).toHaveLength(2);
  expect(container.querySelectorAll('a[href^="/candidate-registrations/"]')).toHaveLength(2);
  expect(container.textContent).toContain('2027');
  expect(container.textContent).toContain('2023');
  expect(container.textContent).toContain(text.planShared);
  expect(container.textContent).toContain(text.noPlan);
  expect(container.querySelector('details').textContent).toContain(text.candidateStatement);
  expect(container.querySelector('a[href="/users/candidate-1"]')).toBeTruthy();
  expect(container.querySelector('a[href="/map?layer=political&district=district-athens-a"]')).toBeTruthy();
});

test('mobile loads the map only when expanded and preserves people before the map', async () => {
  await render(); await choose('district-athens-a');
  expect(mockMap).toBeUndefined();
  await act(async () => button(text.showMap).click());
  expect(mockMap.focusTarget.bounds).toEqual({ north: 38, south: 37.9, east: 23.8, west: 23.7 });
  const profile = container.querySelector('a[href="/persons/mp-1"]');
  expect(profile.compareDocumentPosition(button(text.hideMap)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  await act(async () => mockMap.polygonLayers[0].onFeatureClick(feature));
  expect(container.querySelector('h3').textContent).toBe('Α΄ Αθηνών');
});

test('saved area resolves a district but ambiguous areas require an explicit choice', async () => {
  await render({ homeLocationId: 10 });
  expect(electoralDistrictAPI.getMunicipalityDistricts).toHaveBeenCalledWith(10);
  expect(container.querySelector('h3').textContent).toBe('Α΄ Αθηνών');
  electoralDistrictAPI.getMunicipalityDistricts.mockResolvedValue({ success: true, districts: [{ slug: 'gr-electoral-athens-a' }, { slug: 'gr-electoral-athens-b1-north-athens' }] });
  await render({ homeLocationId: 20 });
  expect(container.textContent).toContain(text.multipleDistricts);
  expect(container.querySelector('select').value).toBe('');
  await act(async () => button('Α΄ Αθηνών').click());
  expect(container.querySelector('select').value).toBe('district-athens-a');
});

test('candidate and boundary failures leave the available MPs accessible', async () => {
  loadPoliticalCandidates.mockRejectedValue(new Error('offline'));
  global.fetch.mockRejectedValue(new Error('offline'));
  await render(); await choose('district-athens-a');
  expect(container.querySelector('a[href="/persons/mp-1"]')).toBeTruthy();
  expect(container.textContent).toContain(text.peopleError);
  expect(container.textContent).not.toContain(text.emptyCandidates);
  await act(async () => button(text.showMap).click());
  expect(container.textContent).toContain(text.mapError);
});

test('a slow saved-area lookup cannot replace a manual district choice', async () => {
  let resolve;
  electoralDistrictAPI.getMunicipalityDistricts.mockReturnValue(new Promise(done => { resolve = done; }));
  await render({ homeLocationId: 10 });
  await choose('district-state');
  await act(async () => resolve({ success: true, districts: [{ slug: 'gr-electoral-athens-a' }] }));
  expect(container.querySelector('select').value).toBe('district-state');
});

test.each(['el', 'en', 'ro'])('new widget and commitment labels exist in %s', locale => {
  const messages = require(`../messages/${locale}.json`).politicalWidget;
  for (const file of ['PoliticalMapWidget', 'ConsultationCommitment', 'CandidateConsultationEditor']) {
    const source = fs.readFileSync(path.join(__dirname, `../components/political/${file}.js`), 'utf8');
    for (const match of source.matchAll(/\bt\('([^']+)'/g)) expect(messages[match[1]]).toEqual(expect.any(String));
  }
});
