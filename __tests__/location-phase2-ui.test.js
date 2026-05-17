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

jest.mock('@/lib/api', () => ({
  locationRoleAPI: {
    getRoles: jest.fn(),
  },
}));

const LocationSections = require('../components/LocationSections').default;
const LocationRoles = require('../components/LocationRoles').default;
const { locationRoleAPI } = require('@/lib/api');

const renderComponent = async (Component, props) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(Component, props));
  });

  return { container, root };
};

describe('Location phase-2 UI', () => {
  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('announcements render severity labels with lighter cards', async () => {
    const { container, root } = await renderComponent(LocationSections, {
      sections: [
        {
          id: 1,
          type: 'announcements',
          isPublished: true,
          content: {
            items: [
              { title: 'Critical alert', priority: 5 },
              { title: 'Warning note', priority: 3 },
              { title: 'Info note', priority: 1 },
            ],
          },
        },
      ],
    });

    expect(container.textContent).toContain('Επείγον');
    expect(container.textContent).toContain('Προειδοποίηση');
    expect(container.textContent).toContain('Ενημέρωση');
    await act(async () => {
      root.unmount();
    });
  });

  test('location roles render improved hierarchy and profile CTA', async () => {
    locationRoleAPI.getRoles.mockResolvedValue({
      success: true,
      roles: [
        {
          key: 'mayor',
          title: 'Δήμαρχος',
          repeatable: false,
          assignment: {
            userId: 9,
            user: {
              username: 'local-mayor',
              firstNameNative: 'Μαρία',
              lastNameNative: 'Παπαδοπούλου',
              slug: 'maria-papadopoulou',
            },
          },
        },
      ],
    });

    const { container, root } = await renderComponent(LocationRoles, { locationId: 1 });

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Αξιωματούχοι Τοποθεσίας');
    expect(container.textContent).toContain('1 ανάθεση');
    expect(container.textContent).toContain('Δήμαρχος');
    expect(container.textContent).toContain('Προβολή προφίλ');
    expect(container.querySelector('a[href="/persons/maria-papadopoulou"]')).toBeTruthy();

    await act(async () => {
      root.unmount();
    });
  });
});
