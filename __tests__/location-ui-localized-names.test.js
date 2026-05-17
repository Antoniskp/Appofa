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

jest.mock('@/components/ui/Badge', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }) => React.createElement('span', null, children),
  };
});

jest.mock('@/components/LocationSections', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', null),
  };
});

const LocationHeader = require('../components/locations/LocationHeader').default;
const LocationBreadcrumb = require('../components/locations/LocationBreadcrumb').default;

const renderComponent = async (Component, props) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(Component, props));
  });

  return { container, root };
};

describe('Location UI localized names', () => {
  afterEach(async () => {
    document.body.innerHTML = '';
  });

  test('renders sub-location chips with local names and fallback name, plus Greek section label', async () => {
    const props = {
      location: {
        id: 101,
        slug: 'athens',
        name: 'Athens',
        name_local: 'Αθήνα',
        type: 'municipality',
        hasModerator: false,
      },
      sections: [],
      children: [
        { id: 1, slug: 'piraeus', name: 'Piraeus', name_local: 'Πειραιάς' },
        { id: 2, slug: 'patra', name: 'Patra' },
      ],
      activePolls: [],
      newsArticles: [],
      regularArticles: [],
      entities: { usersCount: 0 },
      imageError: false,
      setImageError: jest.fn(),
      canManageLocations: () => false,
      onEdit: jest.fn(),
    };

    const { container, root } = await renderComponent(LocationHeader, props);

    expect(container.textContent).toContain('Υποπεριοχές (2)');
    expect(container.textContent).toContain('Πειραιάς');
    expect(container.textContent).toContain('Patra');
    expect(container.textContent).not.toContain('(Πειραιάς)');
    expect(container.textContent).not.toContain('Piraeus');

    await act(async () => {
      root.unmount();
    });
  });

  test('shows limited sub-location chips by default and expands on demand', async () => {
    const manyChildren = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      slug: `child-${i + 1}`,
      name: `Child ${i + 1}`,
      name_local: `Περιοχή ${i + 1}`,
    }));
    const props = {
      location: {
        id: 101,
        slug: 'athens',
        name: 'Athens',
        name_local: 'Αθήνα',
        type: 'municipality',
        hasModerator: false,
      },
      sections: [],
      children: manyChildren,
      activePolls: [],
      newsArticles: [],
      regularArticles: [],
      entities: { usersCount: 0 },
      imageError: false,
      setImageError: jest.fn(),
      canManageLocations: () => false,
      onEdit: jest.fn(),
    };

    const { container, root } = await renderComponent(LocationHeader, props);

    expect(container.textContent).toContain('Περιοχή 8');
    expect(container.textContent).not.toContain('Περιοχή 9');
    expect(container.textContent).toContain('+2 ακόμα υποπεριοχές');

    const toggleButton = container.querySelector('button[aria-label="toggle-sublocations"]');
    expect(toggleButton).toBeTruthy();
    await act(async () => {
      toggleButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Περιοχή 9');
    expect(container.textContent).toContain('Περιοχή 10');
    expect(container.textContent).not.toContain('+2 ακόμα υποπεριοχές');

    await act(async () => {
      root.unmount();
    });
  });

  test('shows phase-2 quick actions and aligned side panel affordances', async () => {
    const props = {
      location: {
        id: 77,
        slug: 'attica',
        name: 'Attica',
        name_local: 'Αττική',
        type: 'prefecture',
        hasModerator: true,
        code: 'AT',
      },
      sections: [],
      children: [],
      activePolls: [],
      newsArticles: [],
      regularArticles: [],
      entities: { usersCount: 0 },
      imageError: false,
      setImageError: jest.fn(),
      canManageLocations: () => true,
      onEdit: jest.fn(),
    };

    const { container, root } = await renderComponent(LocationHeader, props);

    expect(container.textContent).toContain('Γρήγορες ενέργειες');
    expect(container.textContent).toContain('Προτάσεις περιοχής');
    expect(container.textContent).toContain('Ψηφοφορίες περιοχής');
    expect(container.textContent).toContain('Κοινοποίηση');
    expect(container.textContent).toContain('Edit');
    expect(container.textContent).toContain('Περισσότερες πληροφορίες');
    expect(container.querySelector('a[href="/locations/attica?tab=suggestions#location-content"]')).toBeTruthy();

    await act(async () => {
      root.unmount();
    });
  });

  test('renders breadcrumbs with local-name preference and fallback to name', async () => {
    const { container, root } = await renderComponent(LocationBreadcrumb, {
      homeBreadcrumb: [
        { id: 10, slug: 'greece', name: 'Greece', name_local: 'Ελλάδα' },
      ],
      breadcrumb: [
        { id: 1, slug: 'attica', name: 'Attica', name_local: 'Αττική' },
        { id: 2, slug: 'athens', name: 'Athens', name_local: 'Αθήνα' },
      ],
    });

    expect(container.textContent).toContain('Ελλάδα');
    expect(container.textContent).toContain('Αττική');
    expect(container.textContent).toContain('Αθήνα');
    expect(container.textContent).toContain('Προβολή:');
    expect(container.textContent).not.toContain('Greece');
    expect(container.textContent).not.toContain('Attica');
    expect(container.textContent).not.toContain('Athens');

    await act(async () => {
      root.unmount();
    });
  });

  test('shows breadcrumb fallback name when local name is missing', async () => {
    const { container, root } = await renderComponent(LocationBreadcrumb, {
      homeBreadcrumb: [],
      breadcrumb: [
        { id: 1, slug: 'thessaly', name: 'Thessaly' },
        { id: 2, slug: 'larisa', name: 'Larisa', name_local: 'Λάρισα' },
      ],
    });

    expect(container.textContent).toContain('Thessaly');
    expect(container.textContent).toContain('Λάρισα');

    await act(async () => {
      root.unmount();
    });
  });
});
