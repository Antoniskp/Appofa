/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const immediateTimers = [];

beforeAll(() => {
  jest.useFakeTimers();
  global.setTimeout = (callback, delay) => {
    if (typeof callback === 'function') {
      immediateTimers.push(() => callback(delay));
    }
    return immediateTimers.length;
  };
  global.clearTimeout = () => {};
});

afterAll(() => {
  immediateTimers.splice(0, immediateTimers.length);
  jest.useRealTimers();
});

const { createRoot } = require('react-dom/client');

// Mock locationAPI
const mockLocationAPI = {
  getEntityLocations: jest.fn(() => Promise.resolve({
    success: true,
    locations: []
  })),
  link: jest.fn(() => Promise.resolve({ success: true })),
  unlink: jest.fn(() => Promise.resolve({ success: true })),
  getAll: jest.fn(() => Promise.resolve({
    success: true,
    locations: []
  })),
  getById: jest.fn(() => Promise.resolve({
    success: true,
    location: {}
  }))
};

jest.mock('@/lib/api', () => ({
  locationAPI: mockLocationAPI,
  tagAPI: {
    getSuggestions: jest.fn(() => Promise.resolve({ tags: [] })),
  },
}));

// Mock auth-context - default to unauthenticated viewer
const mockUseAuth = jest.fn(() => ({ user: null }));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

const flushPromises = async () => {
  await Promise.resolve();
  while (immediateTimers.length) {
    const pending = immediateTimers.splice(0, immediateTimers.length);
    pending.forEach((callback) => callback());
  }
};

const renderComponent = async (Component, props = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(Component, props));
  });
  await act(async () => {
    await flushPromises();
  });

  return { container, root };
};

describe('ArticleForm Component', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null });
  });

  test('renders form in create mode (article=null)', async () => {
    const ArticleForm = require('../components/articles/ArticleForm').default;
    const onSubmit = jest.fn();
    const onCancel = jest.fn();

    const { container, root } = await renderComponent(ArticleForm, {
      article: null,
      onSubmit,
      onCancel,
      isSubmitting: false,
      submitError: ''
    });

    // Check that form fields are rendered
    expect(container.querySelector('input[name="title"]')).toBeTruthy();
    expect(container.querySelector('textarea[name="content"]')).toBeTruthy();
    expect(container.querySelector('input[name="summary"]')).toBeTruthy();
    expect(container.querySelector('select[name="type"]')).toBeTruthy();
    expect(container.querySelector('select[name="status"]')).toBeTruthy();

    // Check that create button is shown
    expect(container.textContent).toContain('Νέο Άρθρο');

    // Check that location info message is shown (create mode)
    expect(container.textContent).toContain('Οι τοποθεσίες μπορούν να προστεθούν μετά τη δημιουργία του άρθρου');

    await act(async () => {
      root.unmount();
    });
  });

  test('renders form in edit mode (article provided)', async () => {
    const ArticleForm = require('../components/articles/ArticleForm').default;
    const onSubmit = jest.fn();
    const onCancel = jest.fn();

    const article = {
      id: 1,
      title: 'Test Article',
      content: 'Test content',
      summary: 'Test summary',
      type: 'articles',
      category: 'Γενικά',
      tags: ['tag1', 'tag2'],
      status: 'draft'
    };

    const { container, root } = await renderComponent(ArticleForm, {
      article,
      onSubmit,
      onCancel,
      isSubmitting: false,
      submitError: ''
    });

    // Check that form fields are pre-filled
    expect(container.querySelector('input[name="title"]').value).toBe('Test Article');
    expect(container.querySelector('textarea[name="content"]').value).toBe('Test content');
    expect(container.querySelector('input[name="summary"]').value).toBe('Test summary');
    expect(container.querySelector('select[name="type"]').value).toBe('articles');

    // Check that save button is shown
    expect(container.textContent).toContain('Αποθήκευση');

    // Check that location selector section is shown (edit mode)
    // Note: The actual selector might not render due to mocked API, but the section should be present
    expect(container.textContent).toContain('Τοποθεσίες');

    await act(async () => {
      root.unmount();
    });
  });

  test('calls onSubmit with form data when submitted', async () => {
    const ArticleForm = require('../components/articles/ArticleForm').default;
    const onSubmit = jest.fn();
    const onCancel = jest.fn();

    const { container, root } = await renderComponent(ArticleForm, {
      article: null,
      onSubmit,
      onCancel,
      isSubmitting: false,
      submitError: ''
    });

    const form = container.querySelector('form');
    
    // Fill in required fields
    const titleInput = container.querySelector('input[name="title"]');
    const contentTextarea = container.querySelector('textarea[name="content"]');
    
    await act(async () => {
      titleInput.value = 'New Article';
      titleInput.dispatchEvent(new Event('change', { bubbles: true }));
      contentTextarea.value = 'New content';
      contentTextarea.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await flushPromises();
    });

    // Verify onSubmit was called
    expect(onSubmit).toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  test('calls onCancel when cancel button is clicked', async () => {
    const ArticleForm = require('../components/articles/ArticleForm').default;
    const onSubmit = jest.fn();
    const onCancel = jest.fn();

    const { container, root } = await renderComponent(ArticleForm, {
      article: null,
      onSubmit,
      onCancel,
      isSubmitting: false,
      submitError: ''
    });

    const cancelButton = Array.from(container.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('Ακύρωση'));

    await act(async () => {
      cancelButton.click();
      await flushPromises();
    });

    expect(onCancel).toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  test('displays submit error when provided', async () => {
    const ArticleForm = require('../components/articles/ArticleForm').default;
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    const errorMessage = 'Failed to create article';

    const { container, root } = await renderComponent(ArticleForm, {
      article: null,
      onSubmit,
      onCancel,
      isSubmitting: false,
      submitError: errorMessage
    });

    expect(container.textContent).toContain(errorMessage);

    await act(async () => {
      root.unmount();
    });
  });

  test('disables submit button when isSubmitting is true', async () => {
    const ArticleForm = require('../components/articles/ArticleForm').default;
    const onSubmit = jest.fn();
    const onCancel = jest.fn();

    const { container, root } = await renderComponent(ArticleForm, {
      article: null,
      onSubmit,
      onCancel,
      isSubmitting: true,
      submitError: ''
    });

    const submitButton = Array.from(container.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('Δημιουργία...'));

    expect(submitButton).toBeTruthy();
    expect(submitButton.disabled).toBe(true);

    await act(async () => {
      root.unmount();
    });
  });

  test('type and status selects do not render placeholder option', async () => {
    const ArticleForm = require('../components/articles/ArticleForm').default;
    const onSubmit = jest.fn();
    const onCancel = jest.fn();

    const { container, root } = await renderComponent(ArticleForm, {
      article: null,
      onSubmit,
      onCancel,
      isSubmitting: false,
      submitError: ''
    });

    const typeSelect = container.querySelector('select[name="type"]');
    const statusSelect = container.querySelector('select[name="status"]');

    // Neither select should have an empty-value placeholder option
    const typeEmptyOption = Array.from(typeSelect.options).find(o => o.value === '');
    const statusEmptyOption = Array.from(statusSelect.options).find(o => o.value === '');
    expect(typeEmptyOption).toBeUndefined();
    expect(statusEmptyOption).toBeUndefined();

    // Default values should be valid (non-empty)
    expect(typeSelect.value).toBe('personal');
    expect(statusSelect.value).toBe('draft');

    await act(async () => {
      root.unmount();
    });
  });

  test('banner image URL input accepts relative paths', async () => {
    const ArticleForm = require('../components/articles/ArticleForm').default;
    const onSubmit = jest.fn();
    const onCancel = jest.fn();

    const { container, root } = await renderComponent(ArticleForm, {
      article: null,
      onSubmit,
      onCancel,
      isSubmitting: false,
      submitError: ''
    });

    const bannerInput = container.querySelector('input[name="bannerImageUrl"]');
    
    // Verify input type is "text" not "url" to allow relative paths
    expect(bannerInput.type).toBe('text');
    
    // Verify placeholder suggests both URLs and relative paths
    expect(bannerInput.placeholder).toContain('https://');
    expect(bannerInput.placeholder).toContain('/images/');

    await act(async () => {
      root.unmount();
    });
  });

  test('approved checkbox is NOT shown for regular viewers', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, role: 'viewer' } });
    const ArticleForm = require('../components/articles/ArticleForm').default;

    const { container, root } = await renderComponent(ArticleForm, {
      article: null,
      onSubmit: jest.fn(),
      onCancel: jest.fn(),
      isSubmitting: false,
      submitError: ''
    });

    expect(container.querySelector('input[name="approved"]')).toBeNull();

    await act(async () => { root.unmount(); });
  });

  test('approved checkbox is shown for admin users', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, role: 'admin' } });
    const ArticleForm = require('../components/articles/ArticleForm').default;

    const { container, root } = await renderComponent(ArticleForm, {
      article: null,
      onSubmit: jest.fn(),
      onCancel: jest.fn(),
      isSubmitting: false,
      submitError: ''
    });

    const approvedCheckbox = container.querySelector('input[name="approved"]');
    expect(approvedCheckbox).toBeTruthy();
    expect(approvedCheckbox.type).toBe('checkbox');
    expect(container.textContent).toContain('Εγκεκριμένο');

    await act(async () => { root.unmount(); });
  });

  test('approved checkbox is shown for moderator users', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'moderator' } });
    const ArticleForm = require('../components/articles/ArticleForm').default;

    const { container, root } = await renderComponent(ArticleForm, {
      article: null,
      onSubmit: jest.fn(),
      onCancel: jest.fn(),
      isSubmitting: false,
      submitError: ''
    });

    const approvedCheckbox = container.querySelector('input[name="approved"]');
    expect(approvedCheckbox).toBeTruthy();
    expect(approvedCheckbox.type).toBe('checkbox');

    await act(async () => { root.unmount(); });
  });

  test('approved checkbox is pre-checked when article is already approved', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, role: 'admin' } });
    const ArticleForm = require('../components/articles/ArticleForm').default;

    const article = {
      id: 5,
      title: 'Approved Article',
      content: 'Some content',
      summary: '',
      type: 'news',
      status: 'published',
      tags: [],
      newsApprovedAt: '2024-01-01T00:00:00.000Z',
      newsApprovedBy: 1,
    };

    const { container, root } = await renderComponent(ArticleForm, {
      article,
      onSubmit: jest.fn(),
      onCancel: jest.fn(),
      isSubmitting: false,
      submitError: ''
    });

    const approvedCheckbox = container.querySelector('input[name="approved"]');
    expect(approvedCheckbox).toBeTruthy();
    expect(approvedCheckbox.checked).toBe(true);

    await act(async () => { root.unmount(); });
  });

  test('approved checkbox is unchecked when article is not approved', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, role: 'admin' } });
    const ArticleForm = require('../components/articles/ArticleForm').default;

    const article = {
      id: 6,
      title: 'Unapproved Article',
      content: 'Some content',
      summary: '',
      type: 'news',
      status: 'draft',
      tags: [],
      newsApprovedAt: null,
    };

    const { container, root } = await renderComponent(ArticleForm, {
      article,
      onSubmit: jest.fn(),
      onCancel: jest.fn(),
      isSubmitting: false,
      submitError: ''
    });

    const approvedCheckbox = container.querySelector('input[name="approved"]');
    expect(approvedCheckbox).toBeTruthy();
    expect(approvedCheckbox.checked).toBe(false);

    await act(async () => { root.unmount(); });
  });
});
