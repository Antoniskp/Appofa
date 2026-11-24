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
    expect(container.querySelectorAll('a[href^="/suggestions/new"]')).toHaveLength(1);
    expect(container.querySelector('a[href="/suggestions/new?locationId=101"]')).toBeTruthy();
    expect(container.querySelector('a[href="/locations/athens/improve"]').textContent).toContain('Βελτίωσε αυτή τη σελίδα');
    expect(container.querySelector('a[href="/creators?locationId=101"]').textContent).toBe('Δημιουργοί TikTok');
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
    expect(container.querySelector('[aria-current="page"]').textContent).toBe('Αθήνα');
    expect(container.querySelector('a[href="/locations/greece"]').textContent).toContain('Η περιοχή μου');
    expect(container.textContent).not.toContain('Greece');
    expect(container.textContent).not.toContain('Attica');
    expect(container.textContent).not.toContain('Athens');

    await act(async () => {
      root.unmount();
    });
  });

  test('ends the breadcrumb at the viewed ancestor and marks the home separately', async () => {
    const country = { id: 1, slug: 'greece', name_local: 'Ελλάδα' };
    const home = { id: 2, slug: 'ithaki', name_local: 'Ιθάκη' };
    const { container, root } = await renderComponent(LocationBreadcrumb, { breadcrumb: [country], homeBreadcrumb: [country, home] });
    expect(container.querySelector('nav').textContent).toBe('Ελλάδα');
    expect(container.querySelector('a[href="/locations/ithaki"]').textContent).toContain('Η περιοχή μου');
    await act(async () => root.unmount());
  });

  test('shares the open section and attributes the preliminary population figure', async () => {
    const url = '/locations/greece?tab=polls&scope=1#location-content';
    window.history.replaceState({}, '', url);
    const share = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    try {
      const { container, root } = await renderComponent(LocationHeader, {
        location: { id: 1, type: 'country', code: 'GR', name: 'Ελλάδα', population: 10432481 },
        imageError: false, canManageLocations: () => false,
      });
      await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Κοινοποίηση').click());
      expect(share).toHaveBeenCalledWith({ title: 'Ελλάδα', url: window.location.href });
      expect(container.querySelector('a[href*="statistics.gr"]').textContent).toContain('2021 (προσωρινά στοιχεία)');
      await act(async () => root.unmount());
    } finally {
      delete navigator.share;
      window.history.replaceState({}, '', '/');
    }
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
