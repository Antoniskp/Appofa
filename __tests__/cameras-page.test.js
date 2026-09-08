/** @jest-environment <rootDir>/jest-jsdom-env.js */
/* global window, document, MouseEvent */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const baseMapRenderSpy = jest.fn();
const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
let mockAuthState = { user: null, loading: false };

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
    default: function MockBaseMap(props) {
      const {
        markers = [],
        onMarkerHover,
        onMarkerClick,
        onMarkersReady,
      } = props;

      baseMapRenderSpy(props);
      React.useEffect(() => {
        if (onMarkersReady) {
          onMarkersReady({});
        }
      }, [onMarkersReady]);

      return React.createElement(
        'div',
        { 'data-testid': 'base-map' },
        markers.map((marker) => React.createElement(
          'button',
          {
            key: marker.id,
            type: 'button',
            onMouseEnter: () => onMarkerHover?.(marker.id),
            onMouseLeave: () => onMarkerHover?.(null),
            onClick: () => onMarkerClick?.(marker.id),
            'data-testid': `marker-${marker.id}`,
          },
          marker.id
        ))
      );
    },
  };
});

jest.mock('@/hooks/useAsyncData', () => ({
  useAsyncData: jest.fn(),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('@/lib/api', () => ({
  locationSectionAPI: {
    updateCameraStatus: jest.fn(),
  },
  videoPinAPI: {
    getAll: jest.fn(),
    create: jest.fn(),
  },
}));

const { useAsyncData } = require('@/hooks/useAsyncData');
const { locationSectionAPI, videoPinAPI } = require('@/lib/api');
const CamerasPageClient = require('../components/cameras/CamerasPageClient').default;

function mockPageData(cameras, videoPins = []) {
  const cameraRefetch = jest.fn();
  const videoPinRefetch = jest.fn();

  useAsyncData.mockImplementation((_fetcher, dependencies = []) => {
    if (dependencies.length > 0) {
      return {
        data: videoPins,
        loading: false,
        error: null,
        refetch: videoPinRefetch,
      };
    }

    return {
      data: cameras,
      loading: false,
      error: null,
      refetch: cameraRefetch,
    };
  });

  return { cameraRefetch, videoPinRefetch };
}

describe('CamerasPageClient', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    baseMapRenderSpy.mockClear();
    windowOpenSpy.mockClear();
    locationSectionAPI.updateCameraStatus.mockReset();
    videoPinAPI.getAll.mockReset();
    videoPinAPI.create.mockReset();
    mockAuthState = { user: null, loading: false };
  });

  afterEach(async () => {
    useAsyncData.mockReset();
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  test('renders cameras and passes only mappable cameras to the map markers', async () => {
    mockPageData([
      {
        id: '1:0',
        sectionId: 1,
        index: 0,
        label: 'Harbour camera',
        url: 'https://cam.example.com/harbour.jpg',
        embedType: 'image',
        sourceLocation: { id: 1, name: 'Port town', slug: 'port-town', lat: 37.8, lng: 23.6 },
        exactCoordinates: { lat: 37.91, lng: 23.71 },
        mapLocation: { id: 1, name: 'Port town', slug: 'port-town', lat: 37.91, lng: 23.71 },
        mapLocationSource: 'camera',
        isWorking: true,
      },
      {
        id: '1:1',
        sectionId: 1,
        index: 1,
        label: 'Square camera',
        url: 'https://cam.example.com/square',
        embedType: 'link',
        sourceLocation: { id: 3, name: 'Square', slug: 'square', lat: null, lng: null },
        exactCoordinates: null,
        mapLocation: { id: 3, name: 'Square', slug: 'square', lat: null, lng: null },
        mapLocationSource: 'sourceLocation',
      },
    ]);

    await act(async () => {
      root.render(React.createElement(CamerasPageClient));
    });

    expect(container.textContent).toContain('Live κάμερες');
    expect(container.textContent).toContain('Harbour camera');
    expect(container.textContent).toContain('Square camera');
    expect(container.querySelector('button[role="switch"]')).toBeNull();
    expect(container.querySelectorAll('span[aria-label="Σε λειτουργία"]')).toHaveLength(2);
    expect(container.querySelector('[data-testid="base-map"]')).toBeTruthy();

    expect(baseMapRenderSpy).toHaveBeenCalledTimes(1);
    const mapProps = baseMapRenderSpy.mock.calls[0][0];
    expect(mapProps.markers).toHaveLength(1);
    expect(mapProps.markers[0].lat).toBe(37.91);
    expect(mapProps.markers[0].lng).toBe(23.71);
    expect(mapProps.markers[0].popup).toBeUndefined();
    expect(mapProps.markers[0].tooltip).toContain('Harbour camera');
    expect(mapProps.markers[0].tooltip).toContain('Port town');
    expect(mapProps.clusterMarkers).toBe(true);
    expect(typeof mapProps.onMarkerClick).toBe('function');
  });

  test('shows each camera availability with green and red status indicators', async () => {
    mockPageData([
      {
        id: '1:0',
        sectionId: 1,
        index: 0,
        label: 'Harbour camera',
        url: 'https://cam.example.com/harbour.jpg',
        embedType: 'image',
        sourceLocation: { id: 1, name: 'Port town', slug: 'port-town', lat: 37.8, lng: 23.6 },
        exactCoordinates: { lat: 37.91, lng: 23.71 },
        mapLocation: { id: 1, name: 'Port town', slug: 'port-town', lat: 37.91, lng: 23.71 },
        mapLocationSource: 'camera',
      },
      {
        id: '2:0',
        sectionId: 2,
        index: 0,
        label: 'Center cam',
        url: 'https://cam.example.com/center',
        embedType: 'link',
        sourceLocation: { id: 2, name: 'Center', slug: 'center', lat: 37.9, lng: 23.7 },
        exactCoordinates: null,
        mapLocation: { id: 2, name: 'Center', slug: 'center', lat: 37.9, lng: 23.7 },
        mapLocationSource: 'sourceLocation',
        isWorking: false,
      },
    ]);

    await act(async () => {
      root.render(React.createElement(CamerasPageClient));
    });

    expect(container.querySelector('[role="radiogroup"]')).toBeNull();
    expect(container.querySelector('button[role="switch"]')).toBeNull();

    const mapProps = baseMapRenderSpy.mock.calls[baseMapRenderSpy.mock.calls.length - 1][0];
    expect(mapProps.markers).toHaveLength(2);
    expect(mapProps.markers[0].id).toBe('1:0');
    expect(container.textContent).toContain('Harbour camera');
    expect(container.textContent).toContain('Center cam');
    expect(container.querySelectorAll('span[aria-label="Σε λειτουργία"]')).toHaveLength(1);
    expect(container.querySelectorAll('span[aria-label="Προσωρινά εκτός"]')).toHaveLength(1);
    expect(container.querySelector('a[href="https://cam.example.com/center"]')).toBeTruthy();

    await act(async () => {
      const marker = container.querySelector('[data-testid="marker-1:0"]');
      marker.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });

    const harbourTitle = Array.from(container.querySelectorAll('h3')).find((el) => el.textContent === 'Harbour camera');
    expect(harbourTitle.closest('article').className).toContain('bg-blue-50');

    const showOnMapButton = container.querySelector('button[title="Εστίαση στον χάρτη"]');
    expect(showOnMapButton).toBeTruthy();
  });

  test('lets authenticated users toggle one camera status', async () => {
    mockAuthState = { user: { id: 7, username: 'registered' }, loading: false };
    locationSectionAPI.updateCameraStatus.mockResolvedValue({
      success: true,
      camera: {
        id: '1:0',
        sectionId: 1,
        index: 0,
        isWorking: false,
      },
    });

    mockPageData([
      {
        id: '1:0',
        sectionId: 1,
        index: 0,
        label: 'Harbour camera',
        url: 'https://cam.example.com/harbour.jpg',
        embedType: 'image',
        sourceLocation: { id: 1, name: 'Port town', slug: 'port-town', lat: 37.8, lng: 23.6 },
        exactCoordinates: { lat: 37.91, lng: 23.71 },
        mapLocation: { id: 1, name: 'Port town', slug: 'port-town', lat: 37.91, lng: 23.71 },
        mapLocationSource: 'camera',
        isWorking: true,
      },
    ]);

    await act(async () => {
      root.render(React.createElement(CamerasPageClient));
    });

    const statusToggle = container.querySelector('button[role="switch"]');
    expect(statusToggle).toBeTruthy();
    expect(statusToggle.getAttribute('aria-checked')).toBe('true');

    await act(async () => {
      statusToggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(locationSectionAPI.updateCameraStatus).toHaveBeenCalledWith(1, 0, false);
    expect(container.querySelector('button[role="switch"]').getAttribute('aria-checked')).toBe('false');
  });

  test('clicking a marker opens the camera stream URL in a new tab', async () => {
    mockPageData([
      {
        id: '1:0',
        label: 'Harbour camera',
        url: 'https://cam.example.com/harbour.jpg',
        embedType: 'image',
        sourceLocation: { id: 1, name: 'Port town', slug: 'port-town', lat: 37.8, lng: 23.6 },
        exactCoordinates: { lat: 37.91, lng: 23.71 },
        mapLocation: { id: 1, name: 'Port town', slug: 'port-town', lat: 37.91, lng: 23.71 },
        mapLocationSource: 'camera',
      },
      {
        id: '2:0',
        label: 'No-URL camera',
        url: 'javascript:alert(1)',
        embedType: 'link',
        sourceLocation: { id: 2, name: 'Center', slug: 'center', lat: 37.9, lng: 23.7 },
        exactCoordinates: null,
        mapLocation: { id: 2, name: 'Center', slug: 'center', lat: 37.9, lng: 23.7 },
        mapLocationSource: 'sourceLocation',
      },
    ]);

    await act(async () => {
      root.render(React.createElement(CamerasPageClient));
    });

    // Click the marker with a valid URL — should open the stream.
    await act(async () => {
      const marker = container.querySelector('[data-testid="marker-1:0"]');
      marker.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(windowOpenSpy).toHaveBeenCalledTimes(1);
    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://cam.example.com/harbour.jpg',
      '_blank',
      'noopener,noreferrer'
    );

    windowOpenSpy.mockClear();

    // Click the marker with an unsafe URL — should NOT open anything.
    await act(async () => {
      const marker = container.querySelector('[data-testid="marker-2:0"]');
      marker.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  test('clicking an unavailable camera marker still opens its stream URL', async () => {
    mockPageData([
      {
        id: '1:0',
        label: 'Offline camera',
        url: 'https://cam.example.com/offline',
        embedType: 'link',
        sourceLocation: { id: 1, name: 'Port town', slug: 'port-town', lat: 37.8, lng: 23.6 },
        exactCoordinates: null,
        mapLocation: { id: 1, name: 'Port town', slug: 'port-town', lat: 37.8, lng: 23.6 },
        mapLocationSource: 'sourceLocation',
        isWorking: false,
      },
    ]);

    await act(async () => {
      root.render(React.createElement(CamerasPageClient));
    });

    expect(container.querySelector('a[href="https://cam.example.com/offline"]')).toBeTruthy();

    await act(async () => {
      const marker = container.querySelector('[data-testid="marker-1:0"]');
      marker.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://cam.example.com/offline',
      '_blank',
      'noopener,noreferrer'
    );
  });

  test('renders video pins as colored map markers and opens the source video', async () => {
    mockPageData(
      [
        {
          id: '1:0',
          label: 'Harbour camera',
          url: 'https://cam.example.com/harbour.jpg',
          embedType: 'image',
          sourceLocation: { id: 1, name: 'Port town', slug: 'port-town', lat: 37.8, lng: 23.6 },
          exactCoordinates: { lat: 37.91, lng: 23.71 },
          mapLocation: { id: 1, name: 'Port town', slug: 'port-town', lat: 37.91, lng: 23.71 },
          mapLocationSource: 'camera',
        },
      ],
      [
        {
          id: 12,
          title: 'Harbour TikTok update',
          contentType: 'viral',
          category: 'local-news',
          canonicalUrl: 'https://www.tiktok.com/@creator/video/123',
          sourceUrl: 'https://www.tiktok.com/@creator/video/123',
          creatorHandle: '@creator',
          lat: 37.92,
          lng: 23.72,
          location: { id: 1, name: 'Port town', slug: 'port-town' },
        },
      ]
    );

    await act(async () => {
      root.render(React.createElement(CamerasPageClient));
    });

    expect(container.textContent).toContain('Harbour TikTok update');
    expect(container.textContent).toContain('@creator');

    const mapProps = baseMapRenderSpy.mock.calls[baseMapRenderSpy.mock.calls.length - 1][0];
    expect(mapProps.markers).toHaveLength(2);
    const videoMarker = mapProps.markers.find((marker) => marker.id === 'video-pin:12');
    expect(videoMarker).toBeDefined();
    expect(videoMarker.iconColor).toBe('#2563eb');

    await act(async () => {
      const marker = container.querySelector('[data-testid="marker-video-pin:12"]');
      marker.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://www.tiktok.com/@creator/video/123',
      '_blank',
      'noopener,noreferrer'
    );
  });

  test('hover on camera card does not change the bounds prop (avoids map zoom reset)', async () => {
    mockPageData([
      {
        id: '1:0',
        label: 'Harbour camera',
        url: 'https://cam.example.com/harbour.jpg',
        embedType: 'image',
        sourceLocation: { id: 1, name: 'Port town', slug: 'port-town', lat: 37.8, lng: 23.6 },
        exactCoordinates: { lat: 37.91, lng: 23.71 },
        mapLocation: { id: 1, name: 'Port town', slug: 'port-town', lat: 37.91, lng: 23.71 },
        mapLocationSource: 'camera',
      },
      {
        id: '2:0',
        label: 'Center cam',
        url: 'https://cam.example.com/center',
        embedType: 'link',
        sourceLocation: { id: 2, name: 'Center', slug: 'center', lat: 37.9, lng: 23.7 },
        exactCoordinates: null,
        mapLocation: { id: 2, name: 'Center', slug: 'center', lat: 37.9, lng: 23.7 },
        mapLocationSource: 'sourceLocation',
      },
    ]);

    await act(async () => {
      root.render(React.createElement(CamerasPageClient));
    });

    // Capture the bounds prop from the initial render
    const initialBounds = baseMapRenderSpy.mock.calls[0][0].bounds;
    expect(initialBounds).not.toBeNull();

    // Hover a camera marker from the map — this changes hoveredMarkerId state (triggers re-render).
    // (React's mouseenter isn't reliably triggered via dispatchEvent in JSDOM; use marker
    // mouseover which the mock BaseMap converts into onMarkerHover.)
    const marker = container.querySelector('[data-testid="marker-1:0"]');
    await act(async () => {
      marker.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });

    // BaseMap re-renders but the bounds reference must be the SAME object:
    // memoized bounds depend only on camera data (not hover state), so fitBounds
    // must NOT be triggered again by the hover.
    const latestBounds = baseMapRenderSpy.mock.calls[baseMapRenderSpy.mock.calls.length - 1][0].bounds;
    expect(latestBounds).toBe(initialBounds);

    // Also verify the hovered marker receives the 'hovered' variant (icon still updates)
    const lastMarkers = baseMapRenderSpy.mock.calls[baseMapRenderSpy.mock.calls.length - 1][0].markers;
    const hoveredMarker = lastMarkers.find((m) => m.variant === 'hovered');
    expect(hoveredMarker).toBeDefined();
  });
});
