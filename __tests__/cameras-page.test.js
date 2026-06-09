/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const baseMapRenderSpy = jest.fn();

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
  };
});

jest.mock('next/dynamic', () => (_loader, _options) => {
  const React = require('react');
  const ResolvedComponent = require('@/components/map/BaseMap').default;
  return function DynamicWrapper(props) {
    return React.createElement(ResolvedComponent, props);
  };
});

jest.mock('@/components/map/BaseMap', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props) => {
      baseMapRenderSpy(props);
      return React.createElement('div', { 'data-testid': 'base-map' });
    },
  };
});

jest.mock('@/hooks/useAsyncData', () => ({
  useAsyncData: jest.fn(),
}));

const { useAsyncData } = require('@/hooks/useAsyncData');
const CamerasPageClient = require('../components/cameras/CamerasPageClient').default;

describe('CamerasPageClient', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    baseMapRenderSpy.mockClear();
  });

  afterEach(async () => {
    useAsyncData.mockReset();
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  test('renders cameras and passes only mappable cameras to the map markers', async () => {
    useAsyncData.mockReturnValue({
      data: [
        {
          id: '1:0',
          label: 'Harbour camera',
          url: 'https://cam.example.com/harbour.jpg',
          embedType: 'image',
          location: { id: 2, name: 'Harbour', slug: 'harbour', lat: 37.9, lng: 23.7 },
          sourceLocation: { id: 1, name: 'Port town', slug: 'port-town', lat: 37.8, lng: 23.6 },
          mapLocation: { id: 2, name: 'Harbour', slug: 'harbour', lat: 37.9, lng: 23.7 },
        },
        {
          id: '1:1',
          label: 'Square camera',
          url: 'https://cam.example.com/square',
          embedType: 'link',
          location: null,
          sourceLocation: { id: 3, name: 'Square', slug: 'square', lat: null, lng: null },
          mapLocation: { id: 3, name: 'Square', slug: 'square', lat: null, lng: null },
        },
      ],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    await act(async () => {
      root.render(React.createElement(CamerasPageClient));
    });

    expect(container.textContent).toContain('Κάμερες κοινότητας');
    expect(container.textContent).toContain('Harbour camera');
    expect(container.textContent).toContain('Square camera');
    expect(container.querySelector('[data-testid="base-map"]')).toBeTruthy();

    expect(baseMapRenderSpy).toHaveBeenCalledTimes(1);
    const mapProps = baseMapRenderSpy.mock.calls[0][0];
    expect(mapProps.markers).toHaveLength(1);
    expect(mapProps.markers[0].lat).toBe(37.9);
    expect(mapProps.markers[0].lng).toBe(23.7);
  });
});
