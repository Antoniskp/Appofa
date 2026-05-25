/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
  };
});

jest.mock('next/dynamic', () => {
  return () => {
    const React = require('react');
    return function DynamicMap(props) {
      const Comp = require('@/components/map/GreeceBoundaryMap').default;
      return React.createElement(Comp, props);
    };
  };
});

jest.mock('@/components/map/GreeceBoundaryMap', () => {
  const React = require('react');
  const getLocationFeatureKey = (locationLike = {}) => {
    if (locationLike.code) return `code:${String(locationLike.code).trim().toLowerCase()}`;
    if (locationLike.slug) return `slug:${String(locationLike.slug).trim().toLowerCase()}`;
    if (locationLike.name_local) return `name:${String(locationLike.name_local).trim().toLowerCase()}`;
    if (locationLike.name) return `name:${String(locationLike.name).trim().toLowerCase()}`;
    return null;
  };
  return {
    __esModule: true,
    default: (props) => {
      global.__greeceBoundaryMapProps = props;
      return React.createElement('div', { 'data-testid': 'greece-boundary-map-stub' });
    },
    getLocationFeatureKey,
  };
});

const ExploreLocationsMap = require('../components/locations/ExploreLocationsMap').default;

async function renderComponent(props) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(ExploreLocationsMap, props));
  });
  return { container, root };
}

async function cleanup(root, container) {
  await act(async () => { root.unmount(); });
  container.remove();
}

describe('ExploreLocationsMap linked hover behavior', () => {
  const prefectures = [
    { id: 1, name: 'Attica', name_local: 'Αττική', slug: 'attiki', code: 'GR-I', lat: 38, lng: 23.8 },
    { id: 2, name: 'Crete', name_local: 'Κρήτη', slug: 'kriti', code: 'GR-M', lat: 35.3, lng: 24.9 },
  ];

  test('map hover callback highlights corresponding pill', async () => {
    const { container, root } = await renderComponent({ prefectures, loading: false });

    await act(async () => {
      global.__greeceBoundaryMapProps.onLocationHover(2);
    });

    const links = Array.from(container.querySelectorAll('a'));
    const cretePill = links.find((el) => el.textContent.trim() === 'Κρήτη');
    expect(cretePill.className).toMatch(/(?<!hover:)border-blue-300/);

    await cleanup(root, container);
  });

  test('pill hover uses shared layer + marker controls', async () => {
    const { container, root } = await renderComponent({ prefectures, loading: false });

    const layerHighlight = jest.fn();
    const layerUnhighlight = jest.fn();
    const markerHighlight = jest.fn();
    const markerUnhighlight = jest.fn();

    await act(async () => {
      global.__greeceBoundaryMapProps.onLayerInit({
        highlight: layerHighlight,
        unhighlight: layerUnhighlight,
      });
      global.__greeceBoundaryMapProps.onMarkersReady({
        highlight: markerHighlight,
        unhighlight: markerUnhighlight,
      });
    });

    const atticaPill = Array.from(container.querySelectorAll('a'))
      .find((el) => el.textContent.trim() === 'Αττική');

    await act(async () => {
      atticaPill.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });

    expect(layerHighlight).toHaveBeenCalledWith('code:gr-i');
    expect(markerHighlight).toHaveBeenCalledWith('1');

    await act(async () => {
      atticaPill.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    });

    expect(layerUnhighlight).toHaveBeenCalledWith('code:gr-i');
    expect(markerUnhighlight).toHaveBeenCalledWith('1', 'explorer');

    await cleanup(root, container);
  });

  test('passes marker hover callback to map for marker → pill linkage', async () => {
    const { container, root } = await renderComponent({ prefectures, loading: false });

    await act(async () => {
      global.__greeceBoundaryMapProps.onMarkerHover('1');
    });

    const atticaPill = Array.from(container.querySelectorAll('a'))
      .find((el) => el.textContent.trim() === 'Αττική');
    expect(atticaPill.className).toMatch(/(?<!hover:)border-blue-300/);

    await cleanup(root, container);
  });
});
