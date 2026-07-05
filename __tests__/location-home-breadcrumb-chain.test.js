jest.mock('@/lib/api', () => ({
  locationAPI: {
    getById: jest.fn(),
    getAll: jest.fn(),
    getLocationEntities: jest.fn(),
    update: jest.fn(),
    linkEntity: jest.fn(),
    unlinkEntity: jest.fn(),
  },
  locationSectionAPI: {
    getSections: jest.fn(),
  },
  suggestionAPI: {
    getAll: jest.fn(),
  },
  geoAPI: {
    getCountryFunding: jest.fn(),
  },
}));

const { locationAPI } = require('@/lib/api');
const { buildLocationBreadcrumb, shouldShowMainLocationMap } = require('../app/locations/[slug]/page');

describe('buildLocationBreadcrumb', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('resolves missing ancestors via parent_id lookups for complete hierarchy', async () => {
    locationAPI.getById.mockImplementation(async (id) => {
      if (id === 3) {
        return {
          success: true,
          location: {
            id: 3,
            slug: 'athens',
            name: 'Athens',
            parent_id: 2,
            parent: {
              id: 2,
              slug: 'attica',
              name: 'Attica',
              parent_id: 1,
              parent: null,
            },
          },
        };
      }
      if (id === 1) {
        return {
          success: true,
          location: { id: 1, slug: 'greece', name: 'Greece', parent_id: null, parent: null },
        };
      }
      return { success: false };
    });

    const breadcrumb = await buildLocationBreadcrumb(3);

    expect(breadcrumb.map((c) => c.slug)).toEqual(['greece', 'attica', 'athens']);
    expect(locationAPI.getById).toHaveBeenNthCalledWith(1, 3);
    expect(locationAPI.getById).toHaveBeenNthCalledWith(2, 1);
  });
});

describe('shouldShowMainLocationMap', () => {
  test('hides the main map when mapped children will render the hierarchy map', () => {
    expect(shouldShowMainLocationMap({
      location: { id: 1, name: 'Greece', lat: 38.5, lng: 23.8 },
      children: [{ id: 2, name: 'Attica', boundary_geojson: { type: 'Polygon', coordinates: [] } }],
      secondaryLoading: false,
    })).toBe(false);
  });

  test('hides the main map while child geometry is still loading', () => {
    expect(shouldShowMainLocationMap({
      location: { id: 1, name: 'Greece', lat: 38.5, lng: 23.8 },
      children: [],
      secondaryLoading: true,
    })).toBe(false);
  });

  test('shows the main map for a location with own geometry and no mapped children', () => {
    expect(shouldShowMainLocationMap({
      location: { id: 3, name: 'Athens', lat: 37.9838, lng: 23.7275 },
      children: [],
      secondaryLoading: false,
    })).toBe(true);
  });

  test('keeps the main map hidden when there is no geometry anywhere', () => {
    expect(shouldShowMainLocationMap({
      location: { id: 4, name: 'Unknown', lat: null, lng: null },
      children: [{ id: 5, name: 'Child', lat: null, lng: null }],
      secondaryLoading: false,
    })).toBe(false);
  });
});
