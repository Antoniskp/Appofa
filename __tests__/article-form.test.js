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
  locationAPI: mockLocationAPI
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
  });

  test('renders form in create mode (article=null)', async () => {
    const ArticleForm = require('../components/ArticleForm').default;
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

    // Check that "Create Article" button is shown
    expect(container.textContent).toContain('Create Article');

    // Check that location info message is shown (create mode)
    expect(container.textContent).toContain('Locations can be added after creating the article');

    await act(async () => {
      root.unmount();
    });
  });

  test('renders form in edit mode (article provided)', async () => {
    const ArticleForm = require('../components/ArticleForm').default;
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

    // Check that "Save Changes" button is shown
    expect(container.textContent).toContain('Save Changes');

    // Check that location selector section is shown (edit mode)
    // Note: The actual selector might not render due to mocked API, but the section should be present
    expect(container.textContent).toContain('Locations');

    await act(async () => {
      root.unmount();
    });
  });

  test('calls onSubmit with form data when submitted', async () => {
    const ArticleForm = require('../components/ArticleForm').default;
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
    const ArticleForm = require('../components/ArticleForm').default;
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
      .find(btn => btn.textContent === 'Cancel');

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
    const ArticleForm = require('../components/ArticleForm').default;
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
    const ArticleForm = require('../components/ArticleForm').default;
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
      .find(btn => btn.textContent === 'Creating...');

    expect(submitButton).toBeTruthy();
    expect(submitButton.disabled).toBe(true);

    await act(async () => {
      root.unmount();
    });
  });

  test('banner image URL input accepts relative paths', async () => {
    const ArticleForm = require('../components/ArticleForm').default;
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
});
