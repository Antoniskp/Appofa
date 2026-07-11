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

const HomeActionLanes = require('../components/HomeActionLanes').default;

const renderActionLanes = async (user = null) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(HomeActionLanes, { user }));
  });

  return { container, root };
};

describe('HomeActionLanes registration prompts', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('shows a registration bridge for guests after low-friction actions', async () => {
    const { container, root } = await renderActionLanes();

    expect(container.textContent).toContain('Κράτησε τη συμμετοχή σου');
    expect(container.textContent).toContain('Δημιούργησε προφίλ και συνέχισε από εκεί που σταμάτησες.');
    expect(container.textContent).toContain('Ακολούθησε την περιοχή');
    expect(container.querySelector('a[href="/register"]')).toBeTruthy();
    expect(container.querySelector('a[href="/newsletter"]')).toBeTruthy();
    expect(container.textContent).toContain('Εκπροσωπείς κόμμα ή οργάνωση;');

    await act(async () => {
      root.unmount();
    });
  });

  test('hides the guest registration bridge for signed-in users', async () => {
    const { container, root } = await renderActionLanes({
      username: 'local-user',
      homeLocation: { slug: 'athens' },
    });

    expect(container.textContent).not.toContain('Κράτησε τη συμμετοχή σου');
    expect(container.textContent).not.toContain('Δημιούργησε προφίλ και συνέχισε από εκεί που σταμάτησες.');
    expect(container.querySelector('a[href="/newsletter"]')).toBeFalsy();
    expect(container.querySelector('a[href="/locations/athens"]')).toBeTruthy();

    await act(async () => {
      root.unmount();
    });
  });
});
