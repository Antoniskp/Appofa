/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');
const AdminTable = require('../components/admin/AdminTable');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const Component = AdminTable.default || AdminTable;

const render = async (element) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(element);
  });

  return {
    container,
    async cleanup() {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
};

describe('AdminTable', () => {
  it('should export AdminTable component', () => {
    expect(AdminTable).toBeDefined();
    expect(typeof Component).toBe('function');
  });

  it('renders column headers, cell values, and custom render output', async () => {
    const view = await render(React.createElement(Component, {
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'status', label: 'State', render: (item) => React.createElement('strong', null, item.status) },
      ],
      data: [{ id: 1, name: 'Alpha', status: 'active' }],
      actions: false,
    }));

    expect(view.container.querySelector('th').textContent).toBe('Name');
    expect(view.container.textContent).toContain('Alpha');
    expect(view.container.querySelector('strong').textContent).toBe('active');

    await view.cleanup();
  });

  it('renders loading skeletons as direct table rows inside tbody', async () => {
    const view = await render(React.createElement(Component, {
      columns: [{ key: 'name', header: 'Name' }],
      data: [],
      loading: true,
      actions: false,
    }));

    const tbody = view.container.querySelector('tbody');
    const childTags = Array.from(tbody.children).map((node) => node.tagName);

    expect(childTags).toHaveLength(10);
    expect(childTags.every((tag) => tag === 'TR')).toBe(true);
    expect(Array.from(tbody.children).some((node) => node.tagName === 'DIV')).toBe(false);

    await view.cleanup();
  });

  it('supports click and keyboard row activation', async () => {
    const onRowClick = jest.fn();
    const item = { id: 1, name: 'Alpha' };
    const view = await render(React.createElement(Component, {
      columns: [{ key: 'name', header: 'Name' }],
      data: [item],
      onRowClick,
      actions: false,
    }));

    const row = view.container.querySelector('tbody tr');

    await act(async () => {
      row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      row.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    });

    expect(onRowClick).toHaveBeenCalledTimes(3);
    expect(onRowClick).toHaveBeenCalledWith(item);
    expect(row.tabIndex).toBe(0);

    await view.cleanup();
  });

  it('does not trigger row click when an action button is clicked', async () => {
    const onRowClick = jest.fn();
    const onEdit = jest.fn();
    const item = { id: 1, name: 'Alpha' };
    const view = await render(React.createElement(Component, {
      columns: [{ key: 'name', header: 'Name' }],
      data: [item],
      onRowClick,
      onEdit,
    }));

    const editButton = Array.from(view.container.querySelectorAll('button'))
      .find((button) => button.textContent === 'Edit');

    await act(async () => {
      editButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onEdit).toHaveBeenCalledWith(item);
    expect(onRowClick).not.toHaveBeenCalled();

    await view.cleanup();
  });

  it('renders the empty state when there is no data', async () => {
    const view = await render(React.createElement(Component, {
      columns: [{ key: 'name', header: 'Name' }],
      data: [],
      emptyMessage: 'Nothing here',
      actions: false,
    }));

    expect(view.container.textContent).toContain('Nothing here');
    expect(view.container.querySelector('table')).toBeNull();

    await view.cleanup();
  });
});
