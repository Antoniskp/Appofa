/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');
const SkeletonLoader = require('../components/ui/SkeletonLoader');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const Component = SkeletonLoader.default || SkeletonLoader;

describe('SkeletonLoader', () => {
  it('should export SkeletonLoader component', () => {
    expect(SkeletonLoader).toBeDefined();
    expect(typeof Component).toBe('function');
  });

  it('renders table skeletons as table rows without wrapper divs', async () => {
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    document.body.appendChild(table);
    const root = createRoot(tbody);

    await act(async () => {
      root.render(React.createElement(Component, { type: 'table', count: 2 }));
    });

    const childTags = Array.from(tbody.children).map((node) => node.tagName);
    expect(childTags).toEqual(['TR', 'TR']);
    expect(Array.from(tbody.children).some((node) => node.tagName === 'DIV')).toBe(false);

    await act(async () => {
      root.unmount();
    });
    table.remove();
  });

  it('accepts rows as an alias for table skeleton count', async () => {
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    document.body.appendChild(table);
    const root = createRoot(tbody);

    await act(async () => {
      root.render(React.createElement(Component, { type: 'table', rows: 3 }));
    });

    expect(tbody.querySelectorAll('tr')).toHaveLength(3);

    await act(async () => {
      root.unmount();
    });
    table.remove();
  });

  it('still wraps non-table skeletons for layout classes', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(Component, { type: 'button', count: 2, className: 'flex gap-4' }));
    });

    expect(container.firstElementChild.className).toContain('flex gap-4');
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(2);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
