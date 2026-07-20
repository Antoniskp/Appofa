/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');
const AdminTableActions = require('../components/admin/AdminTableActions');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const Component = AdminTableActions.default || AdminTableActions;

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

describe('AdminTableActions', () => {
  it('should export AdminTableActions component', () => {
    expect(AdminTableActions).toBeDefined();
    expect(typeof Component).toBe('function');
  });

  it('renders edit and delete controls as non-submit buttons', async () => {
    const view = await render(React.createElement(Component, {
      item: { id: 1 },
      onEdit: jest.fn(),
      onDelete: jest.fn(),
    }));

    const buttons = Array.from(view.container.querySelectorAll('button'));
    expect(buttons.map((button) => button.textContent)).toEqual(['Edit', 'Delete']);
    expect(buttons.every((button) => button.getAttribute('type') === 'button')).toBe(true);

    await view.cleanup();
  });

  it('calls edit immediately and delete only after confirmation', async () => {
    const item = { id: 1, name: 'Alpha' };
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const view = await render(React.createElement(Component, { item, onEdit, onDelete }));

    const editButton = Array.from(view.container.querySelectorAll('button'))
      .find((button) => button.textContent === 'Edit');
    const deleteButton = Array.from(view.container.querySelectorAll('button'))
      .find((button) => button.textContent === 'Delete');

    await act(async () => {
      editButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      deleteButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onEdit).toHaveBeenCalledWith(item);
    expect(onDelete).not.toHaveBeenCalled();

    const confirmButton = Array.from(document.body.querySelectorAll('button'))
      .find((button) => button.textContent === 'Delete' && button !== deleteButton);

    await act(async () => {
      confirmButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onDelete).toHaveBeenCalledWith(item);

    await view.cleanup();
  });
});
