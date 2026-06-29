/** @jest-environment <rootDir>/jest-jsdom-env.js */

const DropdownMenu = require('../components/ui/DropdownMenu');
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

describe('DropdownMenu', () => {
  it('should export DropdownMenu component', () => {
    expect(DropdownMenu).toBeDefined();
  });

  it('should be a function or object (React component)', () => {
    const type = typeof DropdownMenu.default || typeof DropdownMenu;
    expect(['function', 'object']).toContain(type);
  });

  it('should accept required props', () => {
    const component = DropdownMenu.default || DropdownMenu;
    expect(component).toBeDefined();
    // Component should be callable (a function)
    expect(typeof component).toBe('function');
  });

  it('applies wrapperClassName so mobile dropdowns can fill their container', async () => {
    const component = DropdownMenu.default || DropdownMenu;
    const container = document.createElement('div');
    const root = createRoot(container);
    document.body.appendChild(container);

    await act(async () => {
      root.render(React.createElement(component, {
        triggerText: 'Menu',
        wrapperClassName: 'w-full',
        items: [{ id: 'profile', label: 'Profile', href: '/profile' }],
      }));
    });

    expect(container.firstElementChild.className).toContain('w-full');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('wraps long item labels without letting icons shrink', async () => {
    const component = DropdownMenu.default || DropdownMenu;
    const container = document.createElement('div');
    const root = createRoot(container);
    document.body.appendChild(container);

    await act(async () => {
      root.render(React.createElement(component, {
        triggerText: 'Menu',
        open: true,
        items: [
          {
            id: 'long-link',
            label: 'A very long menu option label that should wrap safely on narrow mobile screens',
            href: '/long-link',
            icon: React.createElement('span', null, 'i'),
          },
          {
            id: 'long-button',
            label: 'Another very long action label that should not widen the viewport',
            onClick: jest.fn(),
            icon: React.createElement('span', null, 'i'),
          },
        ],
      }));
    });

    const link = container.querySelector('a[href="/long-link"]');
    const button = container.querySelector('button[role="menuitem"]');
    const linkIcon = link.children[0];
    const linkLabel = link.children[1];
    const buttonIcon = button.children[0];
    const buttonLabel = button.children[1];

    expect(linkLabel.className).toContain('min-w-0');
    expect(linkLabel.className).toContain('break-words');
    expect(linkIcon.className).toContain('flex-shrink-0');
    expect(buttonLabel.className).toContain('min-w-0');
    expect(buttonLabel.className).toContain('break-words');
    expect(buttonIcon.className).toContain('flex-shrink-0');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
