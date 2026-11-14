/** @jest-environment <rootDir>/jest-jsdom-env.js */

/**
 * Tests for ListPageToolbar shared component and FilterBar layout fix.
 * Verifies that:
 * - ListPageToolbar renders search, filter, and action slots
 * - Filter controls expand BELOW the toggle button (not inline/sideways)
 * - The action button remains accessible regardless of filter state
 * - Civic-questions controls keep filters separate from search, sort, and creation
 * - Polls and suggestions pages import the shared toolbar
 */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }) =>
      React.createElement('a', { href, ...props }, children),
  };
});

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 1 } }),
}));

jest.mock('@/lib/api', () => ({
  civicQuestionAPI: {
    getFeatured: jest.fn(),
    getCategories: jest.fn(),
    getAll: jest.fn(),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function getByText(container, text) {
  return [...container.querySelectorAll('*')].find(
    (el) => el.textContent.trim() === text,
  );
}

// ── ListPageToolbar ───────────────────────────────────────────────────────────

describe('ListPageToolbar', () => {
  const ListPageToolbar = require('../components/ui/ListPageToolbar').default;

  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  test('renders searchSlot content', async () => {
    await act(async () => {
      root.render(
        React.createElement(ListPageToolbar, {
          searchSlot: React.createElement('input', {
            'data-testid': 'search',
            placeholder: 'Search...',
          }),
        }),
      );
    });

    expect(container.querySelector('[data-testid="search"]')).toBeTruthy();
  });

  test('renders actionsSlot content', async () => {
    await act(async () => {
      root.render(
        React.createElement(ListPageToolbar, {
          actionsSlot: React.createElement(
            'button',
            { 'data-testid': 'create-btn' },
            'Create',
          ),
        }),
      );
    });

    expect(container.querySelector('[data-testid="create-btn"]')).toBeTruthy();
  });

  test('renders filtersSlot content', async () => {
    await act(async () => {
      root.render(
        React.createElement(ListPageToolbar, {
          filtersSlot: React.createElement(
            'div',
            { 'data-testid': 'filter-bar' },
            'Filters',
          ),
        }),
      );
    });

    expect(container.querySelector('[data-testid="filter-bar"]')).toBeTruthy();
  });

  test('renders extraSlot content below main row', async () => {
    await act(async () => {
      root.render(
        React.createElement(ListPageToolbar, {
          searchSlot: React.createElement('input', { placeholder: 'Search' }),
          extraSlot: React.createElement(
            'div',
            { 'data-testid': 'extra-row' },
            'Category pills',
          ),
        }),
      );
    });

    const extra = container.querySelector('[data-testid="extra-row"]');
    expect(extra).toBeTruthy();
    // extraSlot is wrapped in a sibling div after the primary toolbar row
    expect(extra.textContent).toBe('Category pills');
  });

  test('search and controls are in the same outer flex wrapper', async () => {
    await act(async () => {
      root.render(
        React.createElement(ListPageToolbar, {
          searchSlot: React.createElement('input', {
            'data-testid': 'search',
          }),
          actionsSlot: React.createElement('button', {
            'data-testid': 'action',
          }),
        }),
      );
    });

    const search = container.querySelector('[data-testid="search"]');
    const action = container.querySelector('[data-testid="action"]');

    // Both should be descendants of the same toolbar root
    expect(search).toBeTruthy();
    expect(action).toBeTruthy();
    // search is inside a flex-1 div; action is inside a flex-shrink-0 div
    const searchParent = search.parentElement;
    const actionParent = action.parentElement;
    // They share a common grandparent (the primary row div)
    expect(searchParent.parentElement).toBe(actionParent.parentElement);
  });

  test('uses md breakpoint row layout with wrap safeguards', async () => {
    await act(async () => {
      root.render(
        React.createElement(ListPageToolbar, {
          searchSlot: React.createElement('input', { 'data-testid': 'search' }),
          filtersSlot: React.createElement('div', { 'data-testid': 'filter-slot' }),
          actionsSlot: React.createElement('button', { 'data-testid': 'action-slot' }),
        }),
      );
    });

    const search = container.querySelector('[data-testid="search"]');
    const row = search.parentElement.parentElement;
    const controls = container.querySelector('[data-testid="filter-slot"]').parentElement;

    expect(row.className).toContain('md:flex-row');
    expect(row.className).toContain('md:flex-wrap');
    expect(search.parentElement.className).toContain('md:min-w-[240px]');
    expect(controls.className).toContain('flex-shrink-0');
    expect(controls.className).toContain('md:flex-wrap');
  });

  test('filtersSlot and actionsSlot share the same controls container', async () => {
    await act(async () => {
      root.render(
        React.createElement(ListPageToolbar, {
          filtersSlot: React.createElement('div', {
            'data-testid': 'filter-slot',
          }),
          actionsSlot: React.createElement('button', {
            'data-testid': 'action-slot',
          }),
        }),
      );
    });

    const filter = container.querySelector('[data-testid="filter-slot"]');
    const action = container.querySelector('[data-testid="action-slot"]');

    // Both should be in the same flex-shrink-0 controls div
    expect(filter.parentElement).toBe(action.parentElement);
  });

  test('accepts optional className prop', async () => {
    await act(async () => {
      root.render(
        React.createElement(ListPageToolbar, {
          className: 'my-custom-class',
          searchSlot: React.createElement('input', { placeholder: 'x' }),
        }),
      );
    });

    const wrapper = container.firstChild;
    expect(wrapper.className).toContain('my-custom-class');
  });
});

// ── FilterBar layout (expanded inputs go below toggle) ────────────────────────

describe('FilterBar expanded-below layout', () => {
  const FilterBar = require('../components/ui/FilterBar').default;

  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  const filterConfig = [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All' },
        { value: 'open', label: 'Open' },
      ],
    },
    {
      name: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Filter by name...',
    },
  ];

  test('toggle button is rendered when filterConfig has items', async () => {
    await act(async () => {
      root.render(
        React.createElement(FilterBar, {
          filters: { status: '', search: '' },
          onChange: () => {},
          filterConfig,
        }),
      );
    });

    const toggle = container.querySelector('button[aria-label="Φίλτρα"]');
    expect(toggle).toBeTruthy();
    expect(toggle.className).toContain('h-10');
    expect(toggle.className).toContain('min-w-10');
  });

  test('expanded filters are NOT rendered when closed', async () => {
    await act(async () => {
      root.render(
        React.createElement(FilterBar, {
          filters: { status: '', search: '' },
          onChange: () => {},
          filterConfig,
          isOpen: false,
        }),
      );
    });

    expect(container.querySelector('select')).toBeNull();
    expect(container.querySelector('input[type="text"]')).toBeNull();
  });

  test('expanded filters ARE rendered when open', async () => {
    await act(async () => {
      root.render(
        React.createElement(FilterBar, {
          filters: { status: '', search: '' },
          onChange: () => {},
          filterConfig,
          isOpen: true,
        }),
      );
    });

    const select = container.querySelector('select');
    const input = container.querySelector('input[type="text"]');

    expect(select).toBeTruthy();
    expect(input).toBeTruthy();
    expect(select.className).toContain('w-full');
    expect(input.className).toContain('w-full');
  });

  test('expanded filters are siblings of the toggle, not children of the toggle', async () => {
    await act(async () => {
      root.render(
        React.createElement(FilterBar, {
          filters: { status: '' },
          onChange: () => {},
          filterConfig: [filterConfig[0]],
          isOpen: true,
        }),
      );
    });

    const toggle = container.querySelector('button[aria-label="Φίλτρα"]');
    const select = container.querySelector('select');

    expect(toggle).toBeTruthy();
    expect(select).toBeTruthy();
    // toggle and the wrapping div for the expanded inputs are siblings
    // within the outer FilterBar flex-col div
    expect(toggle.parentElement).toBe(select.closest('[class*="flex-wrap"]').parentElement);
    // The select should NOT be inside the toggle button
    expect(toggle.contains(select)).toBe(false);
  });

  test('shows active filter count badge when filters have values', async () => {
    await act(async () => {
      root.render(
        React.createElement(FilterBar, {
          filters: { status: 'open', search: '' },
          onChange: () => {},
          filterConfig,
          isOpen: false,
        }),
      );
    });

    const badge = container.querySelector('span.rounded-full');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('1');
  });

  test('returns null when filterConfig is empty', async () => {
    await act(async () => {
      root.render(
        React.createElement(FilterBar, {
          filters: {},
          onChange: () => {},
          filterConfig: [],
        }),
      );
    });

    expect(container.innerHTML).toBe('');
  });
});

describe('civic-questions page toolbar', () => {
  const CivicQuestionsPage = require('../app/civic-questions/page').default;
  const { civicQuestionAPI } = require('@/lib/api');
  let container;
  let root;

  beforeEach(() => {
    jest.clearAllMocks();
    civicQuestionAPI.getFeatured.mockResolvedValue({ success: true, data: null });
    civicQuestionAPI.getCategories.mockResolvedValue({ success: true, data: ['Energy', 'Transport'] });
    civicQuestionAPI.getAll.mockResolvedValue({ success: true, data: [], pagination: { total: 0, totalPages: 1 } });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
  });

  test('expands filters separately while keeping search, sorting, and creation available', async () => {
    await act(async () => { root.render(React.createElement(CivicQuestionsPage)); });
    const search = container.querySelector('input[name="search"]');
    const sort = container.querySelector('select[name="sortBy"]');
    const toggle = container.querySelector('button[aria-controls="civic-filters"]');
    const create = container.querySelector('a[href="/civic-questions/create"]');
    expect(search).toBeTruthy();
    expect(sort).toBeTruthy();
    expect(create).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('#civic-filters')).toBeNull();

    await act(async () => { toggle.click(); });
    const panel = container.querySelector(`#${toggle.getAttribute('aria-controls')}`);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.contains(panel)).toBe(false);
    expect(toggle.compareDocumentPosition(panel) & document.defaultView.Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const control of [search, sort, create]) {
      expect(control.isConnected).toBe(true);
      expect(panel.contains(control)).toBe(false);
    }

    const category = panel.querySelector('select[name="category"]');
    await act(async () => {
      category.value = 'Energy';
      category.dispatchEvent(new document.defaultView.Event('change', { bubbles: true }));
    });
    expect(civicQuestionAPI.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'Energy' }));

    await act(async () => { toggle.click(); });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('#civic-filters')).toBeNull();
    await act(async () => {
      sort.value = 'most_voted';
      sort.dispatchEvent(new document.defaultView.Event('change', { bubbles: true }));
    });
    expect(civicQuestionAPI.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'Energy', sortBy: 'most_voted' }));
    expect(create.isConnected).toBe(true);
    await act(async () => { toggle.click(); });
    expect(container.querySelector('select[name="category"]').value).toBe('Energy');
  });
});

// ── Smoke tests: pages import ListPageToolbar ─────────────────────────────────

describe('list-page toolbar adoption smoke tests', () => {
  test('polls page module imports ListPageToolbar', () => {
    const fs = require('fs');
    const src = fs.readFileSync(
      require('path').join(__dirname, '../app/polls/page.js'),
      'utf8',
    );
    expect(src).toContain('ListPageToolbar');
  });

  test('suggestions page module imports ListPageToolbar', () => {
    const fs = require('fs');
    const src = fs.readFileSync(
      require('path').join(__dirname, '../app/suggestions/page.js'),
      'utf8',
    );
    expect(src).toContain('ListPageToolbar');
  });

  test('ListPageToolbar is exported from components/ui/index.js', () => {
    const fs = require('fs');
    const src = fs.readFileSync(
      require('path').join(__dirname, '../components/ui/index.js'),
      'utf8',
    );
    expect(src).toContain("export { default as ListPageToolbar }");
  });

});
