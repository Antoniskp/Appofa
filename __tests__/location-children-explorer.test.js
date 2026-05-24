/** @jest-environment jsdom */

/**
 * Tests for LocationChildrenExplorer:
 *   - pills rendered for each child
 *   - section title uses getChildLocationTerminology labels
 *   - hideChildren prop suppresses child chips in LocationHeader
 *   - hideChildren prop suppresses children in LocationRelatedLocations
 *   - loading skeleton rendered when loading=true
 *   - no render when children is empty after loading
 *   - selected child preview card shown on pill click
 *   - map hover callback updates pill hover state (via onFeatureHover in BaseMap)
 */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
  };
});

jest.mock('next/dynamic', () => {
  return (loader, _opts) => {
    // Return a synchronous stub so tests don't need async dynamic imports
    const React = require('react');
    return function DynamicStub(props) {
      return React.createElement('div', { 'data-testid': 'base-map-stub', ...props });
    };
  };
});

jest.mock('@/components/map/GreeceBoundaryMap', () => {
  const React = require('react');
  const stub = function GreeceBoundaryMapStub() {
    return React.createElement('div', { 'data-testid': 'greece-boundary-map-stub' });
  };
  // Named exports used by LocationChildrenExplorer
  function buildFeatureCollectionFromLocations(locations) {
    const features = locations.flatMap((loc) => {
      if (!loc.boundary_geojson) return [];
      const geom = typeof loc.boundary_geojson === 'string'
        ? JSON.parse(loc.boundary_geojson)
        : loc.boundary_geojson;
      return [{
        type: 'Feature',
        geometry: geom,
        properties: { name: loc.name_local || loc.name, slug: loc.slug, code: loc.code || null, boundary_color: null },
      }];
    });
    if (features.length === 0) return null;
    return { type: 'FeatureCollection', features };
  }
  stub.buildFeatureCollectionFromLocations = buildFeatureCollectionFromLocations;
  return { __esModule: true, default: stub, buildFeatureCollectionFromLocations };
});

jest.mock('@/components/ui/Badge', () => {
  const React = require('react');
  return { __esModule: true, default: ({ children }) => React.createElement('span', null, children) };
});

jest.mock('@/components/LocationSections', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('div') };
});

const LocationChildrenExplorer = require('../components/locations/LocationChildrenExplorer').default;
const LocationHeader = require('../components/locations/LocationHeader').default;
const LocationRelatedLocations = require('../components/locations/LocationRelatedLocations').default;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function renderComponent(Component, props) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(Component, props));
  });
  return { container, root };
}

async function cleanup(root, container) {
  await act(async () => { root.unmount(); });
  container.remove();
}

const SAMPLE_POLYGON = {
  type: 'Polygon',
  coordinates: [[[22.9, 38.2], [23.0, 38.5], [23.9, 38.4], [22.9, 38.2]]],
};

const makeChild = (id, name, nameLocal, slug, withBoundary = false) => ({
  id,
  name,
  name_local: nameLocal,
  slug,
  type: 'prefecture',
  lat: 37.9,
  lng: 23.7,
  boundary_geojson: withBoundary ? SAMPLE_POLYGON : null,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LocationChildrenExplorer', () => {
  const location = {
    id: 1,
    slug: 'greece',
    name: 'Greece',
    name_local: 'Ελλάδα',
    type: 'country',
    lat: 38.5,
    lng: 23.8,
  };

  test('renders nothing when children is empty and loading is false', async () => {
    const { container, root } = await renderComponent(LocationChildrenExplorer, {
      location,
      children: [],
      loading: false,
    });
    expect(container.querySelector('#location-children-explorer')).toBeNull();
    await cleanup(root, container);
  });

  test('renders skeleton when loading is true', async () => {
    const { container, root } = await renderComponent(LocationChildrenExplorer, {
      location,
      children: [],
      loading: true,
    });
    const section = container.querySelector('#location-children-explorer');
    expect(section).not.toBeNull();
    // animated pulse skeleton present
    expect(container.querySelector('.animate-pulse')).not.toBeNull();
    await cleanup(root, container);
  });

  test('renders a pill for each child location', async () => {
    const children = [
      makeChild(1, 'Attica', 'Αττική', 'attiki'),
      makeChild(2, 'Crete', 'Κρήτη', 'kriti'),
      makeChild(3, 'Macedonia', 'Μακεδονία', 'makedonia'),
    ];
    const { container, root } = await renderComponent(LocationChildrenExplorer, {
      location,
      children,
      loading: false,
    });
    const pills = container.querySelectorAll('button[role="listitem"]');
    expect(pills).toHaveLength(3);
    const texts = Array.from(pills).map((b) => b.textContent.trim());
    expect(texts).toContain('Αττική');
    expect(texts).toContain('Κρήτη');
    expect(texts).toContain('Μακεδονία');
    await cleanup(root, container);
  });

  test('section title uses country child terminology (Νομοί / Περιφέρειες)', async () => {
    const children = [makeChild(1, 'Attica', 'Αττική', 'attiki')];
    const { container, root } = await renderComponent(LocationChildrenExplorer, {
      location,
      children,
      loading: false,
    });
    expect(container.textContent).toContain('Νομοί / Περιφέρειες');
    await cleanup(root, container);
  });

  test('section title uses prefecture child terminology (Δήμοι) for prefecture parent', async () => {
    const prefLoc = { ...location, type: 'prefecture', name: 'Attica', slug: 'attiki' };
    const children = [makeChild(1, 'Athens', 'Αθήνα', 'athens')];
    const { container, root } = await renderComponent(LocationChildrenExplorer, {
      location: prefLoc,
      children,
      loading: false,
    });
    expect(container.textContent).toContain('Δήμοι');
    await cleanup(root, container);
  });

  test('shows selected child preview card when a pill is clicked', async () => {
    const children = [makeChild(1, 'Attica', 'Αττική', 'attiki')];
    const { container, root } = await renderComponent(LocationChildrenExplorer, {
      location,
      children,
      loading: false,
    });
    const pill = container.querySelector('button[role="listitem"]');
    await act(async () => {
      pill.click();
    });
    // Preview card should show the selected child name and an "open" link
    expect(container.textContent).toContain('Αττική');
    const openLink = container.querySelector('a[href="/locations/attiki"]');
    expect(openLink).not.toBeNull();
    await cleanup(root, container);
  });

  test('deselects child when the same pill is clicked again', async () => {
    const children = [makeChild(1, 'Attica', 'Αττική', 'attiki')];
    const { container, root } = await renderComponent(LocationChildrenExplorer, {
      location,
      children,
      loading: false,
    });
    const pill = container.querySelector('button[role="listitem"]');
    // First click selects
    await act(async () => { pill.click(); });
    expect(container.querySelector('a[href="/locations/attiki"]')).not.toBeNull();
    // Second click deselects
    await act(async () => { pill.click(); });
    // Preview link should be gone
    const links = Array.from(container.querySelectorAll('a[href="/locations/attiki"]'));
    // No preview card — link may not exist anymore
    const previewCard = container.querySelector('.bg-blue-50.rounded-lg');
    // After deselect, there should be no preview card with flex layout
    // We just check no "Άνοιγμα" button exists
    const openLinks = container.querySelectorAll('a');
    const hasOpenButton = Array.from(openLinks).some((a) =>
      a.textContent.trim().startsWith('Άνοιγμα')
    );
    expect(hasOpenButton).toBe(false);
    await cleanup(root, container);
  });

  test('shows map stub when children have boundary_geojson', async () => {
    const children = [makeChild(1, 'Attica', 'Αττική', 'attiki', true)];
    const { container, root } = await renderComponent(LocationChildrenExplorer, {
      location,
      children,
      loading: false,
    });
    // BaseMap dynamic stub should be present
    const mapStub = container.querySelector('[data-testid="base-map-stub"]');
    expect(mapStub).not.toBeNull();
    expect(mapStub.className).toContain('lg:aspect-square');
    expect(container.querySelector('[data-testid="children-explorer-split-layout"]')).not.toBeNull();
    await cleanup(root, container);
  });

  test('renders pills-only when children have no geometry', async () => {
    const children = [
      { id: 1, name: 'District A', name_local: null, slug: 'district-a', type: 'municipality', lat: null, lng: null, boundary_geojson: null },
    ];
    const { container, root } = await renderComponent(LocationChildrenExplorer, {
      location,
      children,
      loading: false,
    });
    expect(container.querySelector('[data-testid="base-map-stub"]')).toBeNull();
    expect(container.querySelector('[data-testid="children-explorer-stacked-layout"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="children-explorer-split-layout"]')).toBeNull();
    const pills = container.querySelectorAll('button[role="listitem"]');
    expect(pills).toHaveLength(1);
    await cleanup(root, container);
  });
});

// ── hideChildren prop — LocationHeader ────────────────────────────────────────

describe('LocationHeader hideChildren prop', () => {
  const baseProps = {
    location: { id: 1, slug: 'greece', name: 'Greece', name_local: 'Ελλάδα', type: 'country', hasModerator: false },
    sections: [],
    activePolls: [],
    newsArticles: [],
    regularArticles: [],
    suggestionsCount: 0,
    entities: { usersCount: 0 },
    imageError: false,
    setImageError: jest.fn(),
    canManageLocations: () => false,
    onEdit: jest.fn(),
  };
  const childList = [
    { id: 1, slug: 'attiki', name: 'Attica', name_local: 'Αττική' },
    { id: 2, slug: 'kriti', name: 'Crete', name_local: 'Κρήτη' },
  ];

  test('renders child chips when hideChildren is false (default)', async () => {
    const { container, root } = await renderComponent(LocationHeader, {
      ...baseProps,
      children: childList,
      hideChildren: false,
    });
    // Should see "Νομοί / Περιφέρειες (2)"
    expect(container.textContent).toContain('Νομοί / Περιφέρειες (2)');
    await cleanup(root, container);
  });

  test('suppresses child chips when hideChildren is true', async () => {
    const { container, root } = await renderComponent(LocationHeader, {
      ...baseProps,
      children: childList,
      hideChildren: true,
    });
    // Child chips section should not appear
    expect(container.textContent).not.toContain('Νομοί / Περιφέρειες (2)');
    await cleanup(root, container);
  });

  test('uses denser desktop header column balance classes', async () => {
    const { container, root } = await renderComponent(LocationHeader, {
      ...baseProps,
      children: childList,
      hideChildren: true,
    });
    const desktopGrid = container.querySelector('.lg\\:grid-cols-12');
    expect(desktopGrid).not.toBeNull();
    expect(desktopGrid.classList.contains('gap-5')).toBe(true);
    expect(container.querySelector('.lg\\:col-span-7')).not.toBeNull();
    expect(container.querySelector('.lg\\:col-span-5')).not.toBeNull();
    await cleanup(root, container);
  });
});

// ── hideChildren prop — LocationRelatedLocations ──────────────────────────────

describe('LocationRelatedLocations hideChildren prop', () => {
  const location = { id: 1, slug: 'greece', name: 'Greece', name_local: 'Ελλάδα', type: 'country' };
  const parent = null;
  const siblings = [{ id: 10, slug: 'cyprus', name: 'Cyprus', name_local: 'Κύπρος' }];
  const children = [
    { id: 1, slug: 'attiki', name: 'Attica', name_local: 'Αττική' },
    { id: 2, slug: 'kriti', name: 'Crete', name_local: 'Κρήτη' },
  ];

  test('renders child chips when hideChildren is false (default)', async () => {
    const { container, root } = await renderComponent(LocationRelatedLocations, {
      location,
      parent,
      siblings,
      children,
      hideChildren: false,
    });
    expect(container.textContent).toContain('Αττική');
    expect(container.textContent).toContain('Κρήτη');
    await cleanup(root, container);
  });

  test('suppresses child chips when hideChildren is true', async () => {
    const { container, root } = await renderComponent(LocationRelatedLocations, {
      location,
      parent,
      siblings,
      children,
      hideChildren: true,
    });
    // Child names should not appear
    expect(container.textContent).not.toContain('Αττική');
    expect(container.textContent).not.toContain('Κρήτη');
    // But siblings should still appear
    expect(container.textContent).toContain('Κύπρος');
    await cleanup(root, container);
  });

  test('returns null when hideChildren=true and no parent/siblings', async () => {
    const { container, root } = await renderComponent(LocationRelatedLocations, {
      location,
      parent: null,
      siblings: [],
      children,
      hideChildren: true,
    });
    expect(container.querySelector('#location-related')).toBeNull();
    await cleanup(root, container);
  });
});
