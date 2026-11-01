/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/dynamic', () => () => props => React.createElement('div', {
  'data-testid': 'map', 'data-center': JSON.stringify(props.center),
  'data-markers': JSON.stringify(props.markers),
}));
jest.mock('next/link', () => ({ children, ...props }) => React.createElement('a', props, children));
const SuggestionLocation = require('../components/suggestions/SuggestionLocation').default;

describe('Suggestion detail location', () => {
  let container, root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  const render = async suggestion => act(async () => root.render(React.createElement(SuggestionLocation, { suggestion })));

  test('shows the saved pin, category, location link and directions for decimal API strings', async () => {
    await render({ mapLat: '37.983810', mapLng: '23.727539', mapIssueType: 'pothole', location: { name: 'Αθήνα', slug: 'athina' } });
    const map = container.querySelector('[data-testid="map"]');
    expect(JSON.parse(map.dataset.center)).toEqual([37.98381, 23.727539]);
    expect(JSON.parse(map.dataset.markers)[0]).toMatchObject({ lat: 37.98381, lng: 23.727539 });
    expect(container.textContent).toContain('Λακκούβα');
    expect(container.querySelector('a').getAttribute('href')).toBe('/locations/athina');
    expect(container.querySelector('a[target="_blank"]').href).toContain('destination=37.98381,23.727539');
  });

  test('accepts coordinates on the equator and prime meridian', async () => {
    await render({ mapLat: 0, mapLng: 0 });
    expect(container.querySelector('[data-testid="map"]').dataset.center).toBe('[0,0]');
  });

  test.each([[null, null], ['', ''], [' ', ' '], [91, 23], [38, 181], ['invalid', 23], [38, null]])('does not invent a pin for invalid or missing coordinates (%s, %s)', async (mapLat, mapLng) => {
    await render({ mapLat, mapLng, location: { name: 'Αθήνα', slug: 'athina' } });
    expect(container.querySelector('[data-testid="map"]')).toBeNull();
    expect(container.textContent).toContain('Δεν έχει οριστεί ακριβές σημείο');
    expect(container.querySelector('a[target="_blank"]')).toBeNull();
  });

  test('omits the section when neither location nor pin exists', async () => {
    await render({});
    expect(container.innerHTML).toBe('');
  });
});
