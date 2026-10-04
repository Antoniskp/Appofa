/** @jest-environment <rootDir>/jest-jsdom-env.js */

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

  test('keeps the local name and one location-aware proposal action in the header', async () => {
    const onEdit = jest.fn();
    const { container, root } = await renderComponent(LocationHeader, {
      location: { id: 101, slug: 'athens', name: 'Athens', name_local: 'Αθήνα', type: 'municipality', population: 1000 },
      imageError: false, setImageError: jest.fn(), canManageLocations: () => true, onEdit,
    });
    expect(container.querySelector('h1').textContent).toBe('Αθήνα');
    expect(container.textContent).toContain('Δήμος');
    expect(container.querySelectorAll('a')).toHaveLength(1);
    expect(container.querySelector('a').getAttribute('href')).toBe('/suggestions/new?locationId=101');
    await act(async () => container.querySelector('button[aria-label="Επεξεργασία τοποθεσίας"]').click());
    expect(onEdit).toHaveBeenCalledTimes(1);
    await act(async () => root.unmount());
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
