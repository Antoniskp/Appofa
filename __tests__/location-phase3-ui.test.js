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

const LocationOverviewPanel = require('../components/locations/LocationOverviewPanel').default;
const LocationRelatedLocations = require('../components/locations/LocationRelatedLocations').default;

const renderComponent = async (Component, props) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(Component, props));
  });

  return { container, root };
};

describe('Location phase-3 UI', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('overview panel surfaces summary cards with empty-state guidance', async () => {
    const { container, root } = await renderComponent(LocationOverviewPanel, {
      locationIdentifier: 'attica',
      canManageLocations: true,
      summaryCounts: {
        suggestions: 4,
        representatives: 0,
        announcements: 2,
        media: 0,
        community: 7,
        children: 3,
      },
    });

    expect(container.textContent).toContain('Σύνοψη τοποθεσίας');
    expect(container.textContent).toContain('Προτάσεις');
    expect(container.textContent).toContain('4');
    expect(container.textContent).toContain('Δεν έχουν οριστεί ακόμη ρόλοι');
    expect(container.textContent).toContain('Δεν έχουν προστεθεί ακόμη τοπικά μέσα');
    expect(container.querySelector('a[href="/locations/attica?tab=suggestions#location-content"]')).toBeTruthy();
    expect(container.querySelector('a[href="#location-roles"]')).toBeTruthy();

    await act(async () => {
      root.unmount();
    });
  });

  test('related locations renders compact chips with limited previews', async () => {
    const children = Array.from({ length: 9 }, (_, index) => ({
      id: index + 10,
      slug: `child-${index + 1}`,
      type: 'municipality',
      name: `Child ${index + 1}`,
      name_local: `Παιδί ${index + 1}`,
    }));

    const { container, root } = await renderComponent(LocationRelatedLocations, {
      location: { id: 1, slug: 'attica', name: 'Attica', name_local: 'Αττική' },
      parent: { id: 2, slug: 'greece', type: 'country', name: 'Greece', name_local: 'Ελλάδα' },
      siblings: [
        { id: 3, slug: 'crete', type: 'prefecture', name: 'Crete', name_local: 'Κρήτη' },
      ],
      children,
    });

    expect(container.textContent).toContain('Κοντινές και σχετικές τοποθεσίες');
    expect(container.textContent).toContain('Ελλάδα');
    expect(container.textContent).toContain('Κρήτη');
    expect(container.textContent).toContain('Παιδί 8');
    expect(container.textContent).not.toContain('Παιδί 9');
    expect(container.textContent).toContain('+1 ακόμη υποπεριοχές');

    await act(async () => {
      root.unmount();
    });
  });
});
