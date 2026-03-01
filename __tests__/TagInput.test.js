/** @jest-environment jsdom */

/**
 * Tests for the TagInput component – tag parsing, normalization, and basic UI.
 */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock tagAPI used inside TagInput (via lib/api)
jest.mock('@/lib/api', () => ({
  tagAPI: {
    getSuggestions: jest.fn(() => Promise.resolve({ tags: ['javascript', 'react', 'node'] })),
  },
  locationAPI: {
    getEntityLocations: jest.fn(() => Promise.resolve({ success: true, locations: [] })),
    link: jest.fn(() => Promise.resolve({ success: true })),
    unlink: jest.fn(() => Promise.resolve({ success: true })),
    getAll: jest.fn(() => Promise.resolve({ success: true, locations: [] })),
    getById: jest.fn(() => Promise.resolve({ success: true, location: {} })),
  },
}));

const renderComponent = async (Component, props = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(Component, props));
  });

  return { container, root };
};

// ---------------------------------------------------------------------------
// Tag normalization / parsing logic (pure unit tests – no DOM needed)
// ---------------------------------------------------------------------------

describe('Tag normalization logic', () => {
  // Mirror the normalization applied inside TagInput's commitTag
  const normalizeTag = (raw) => raw.trim().replace(/\s+/g, ' ');

  const isNewTag = (tags, raw) => {
    const tag = normalizeTag(raw);
    if (!tag) return false;
    return !tags.some((t) => t.toLowerCase() === tag.toLowerCase());
  };

  test('trims whitespace from tags', () => {
    expect(normalizeTag('  hello  ')).toBe('hello');
  });

  test('collapses internal whitespace', () => {
    expect(normalizeTag('foo   bar')).toBe('foo bar');
  });

  test('deduplicates case-insensitively', () => {
    const existing = ['JavaScript', 'React'];
    expect(isNewTag(existing, 'javascript')).toBe(false);
    expect(isNewTag(existing, 'REACT')).toBe(false);
    expect(isNewTag(existing, 'node')).toBe(true);
  });

  test('ignores empty tags', () => {
    expect(normalizeTag('   ')).toBe('');
    expect(isNewTag([], '   ')).toBe(false);
  });

  test('parses comma-separated input into multiple tags', () => {
    const input = 'foo, bar, baz';
    const parts = input.split(',').map((p) => normalizeTag(p)).filter(Boolean);
    expect(parts).toEqual(['foo', 'bar', 'baz']);
  });
});

// ---------------------------------------------------------------------------
// TagInput component rendering tests
// ---------------------------------------------------------------------------

describe('TagInput Component', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('renders with a label and help text', async () => {
    const TagInput = require('../components/TagInput').default;

    const { container, root } = await renderComponent(TagInput, {
      value: [],
      onChange: jest.fn(),
      label: 'Tags',
      helpText: 'Separate tags with commas.',
    });

    expect(container.textContent).toContain('Tags');
    expect(container.textContent).toContain('Separate tags with commas.');

    await act(async () => { root.unmount(); });
  });

  test('renders existing tags as chip elements', async () => {
    const TagInput = require('../components/TagInput').default;

    const { container, root } = await renderComponent(TagInput, {
      value: ['react', 'node'],
      onChange: jest.fn(),
    });

    expect(container.textContent).toContain('react');
    expect(container.textContent).toContain('node');

    await act(async () => { root.unmount(); });
  });

  test('calls onChange with tag removed when X button is clicked', async () => {
    const TagInput = require('../components/TagInput').default;
    const onChange = jest.fn();

    const { container, root } = await renderComponent(TagInput, {
      value: ['react', 'node'],
      onChange,
    });

    // Click the first remove button (for 'react')
    const removeButtons = container.querySelectorAll('button[aria-label^="Remove tag"]');
    expect(removeButtons.length).toBe(2);

    await act(async () => {
      removeButtons[0].click();
    });

    expect(onChange).toHaveBeenCalledWith(['node']);

    await act(async () => { root.unmount(); });
  });

  test('shows placeholder text when no tags are present', async () => {
    const TagInput = require('../components/TagInput').default;

    const { container, root } = await renderComponent(TagInput, {
      value: [],
      onChange: jest.fn(),
      placeholder: 'Add a tag…',
    });

    const input = container.querySelector('input[type="text"]');
    expect(input).toBeTruthy();
    expect(input.placeholder).toBe('Add a tag…');

    await act(async () => { root.unmount(); });
  });

  test('has combobox role and ARIA attributes on input', async () => {
    const TagInput = require('../components/TagInput').default;

    const { container, root } = await renderComponent(TagInput, {
      value: [],
      onChange: jest.fn(),
      suggestions: ['react', 'vue'],
    });

    const input = container.querySelector('[role="combobox"]');
    expect(input).toBeTruthy();
    expect(input.getAttribute('aria-haspopup')).toBe('listbox');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');

    await act(async () => { root.unmount(); });
  });
});
