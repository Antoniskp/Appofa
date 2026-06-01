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
const { buildLocationBreadcrumb } = require('../app/locations/[slug]/page');

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
