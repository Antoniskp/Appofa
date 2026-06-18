/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/dynamic', () => {
  return () => {
    const React = require('react');
    return function DynamicMapStub(props) {
      global.__locationEditMapProps = global.__locationEditMapProps || [];
      global.__locationEditMapProps.push(props);
      return React.createElement('div', {
        'data-testid': 'dynamic-map-stub',
        className: props.className,
      });
    };
  };
});

jest.mock('@/components/LocationSectionManager', () => () => null);
jest.mock('@/components/LocationRoleManager', () => () => null);
jest.mock('@/components/locations/LocationModeratorManager', () => () => null);
jest.mock('@/components/locations/LocationBoundaryGeoJsonField', () => () => null);
jest.mock('@/lib/api', () => ({ locationAPI: { uploadImage: jest.fn() } }));
jest.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ success: jest.fn(), error: jest.fn() }),
}));

const LocationEditForm = require('../components/locations/LocationEditForm').default;

describe('LocationEditForm map sizing', () => {
  test('uses updated map sizing classes for coordinate and viewport pickers', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    global.__locationEditMapProps = [];

    await act(async () => {
      root.render(
        React.createElement(LocationEditForm, {
          location: { id: 1, name: 'Greece' },
          editedData: {
            name: 'Greece',
            name_local: 'Ελλάδα',
            code: 'GR',
            lat: '',
            lng: '',
            wikipedia_url: '',
            boundary_geojson: null,
            boundary_color: '',
            map_default_center_lat: '',
            map_default_center_lng: '',
            map_default_zoom: '',
          },
          isSaving: false,
          onSave: jest.fn(),
          onCancel: jest.fn(),
          onInputChange: jest.fn(),
          onImageUploaded: jest.fn(),
          onBoundaryValidationChange: jest.fn(),
        })
      );
    });

    const mapClassNames = global.__locationEditMapProps.map((p) => p.className);
    expect(mapClassNames).toContain('h-[300px] w-full rounded-xl overflow-hidden sm:h-[340px]');
    expect(mapClassNames.filter((c) => c === 'h-[300px] w-full rounded-xl overflow-hidden sm:h-[340px]')).toHaveLength(2);

    await act(async () => { root.unmount(); });
    container.remove();
  });
});
