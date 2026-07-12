/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockMediaAPI = {
  list: jest.fn(() => Promise.resolve({
    success: true,
    media: [{
      id: 77,
      url: '/uploads/media/poll.webp',
      variants: { thumbnail: { url: '/uploads/media/poll-thumb.webp' } },
      altText: 'Reusable poll asset',
    }],
    quota: { usedBytes: 1024, totalBytes: 2048, remainingBytes: 1024 },
  })),
  upload: jest.fn(),
};

jest.mock('@/lib/api', () => ({
  locationAPI: {
    getById: jest.fn(() => Promise.resolve({ success: true, location: {} })),
  },
  mediaAPI: mockMediaAPI,
  tagAPI: {
    getSuggestions: jest.fn(() => Promise.resolve({ tags: [] })),
  },
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 5, role: 'user', username: 'polluser' } }),
}));

jest.mock('@/components/ui/CascadingLocationSelector', () => ({
  __esModule: true,
  default: () => React.createElement('div', null),
}));

jest.mock('@/components/ui/TagInput', () => ({
  __esModule: true,
  default: () => React.createElement('div', null),
}));

jest.mock('@/components/ui/Tooltip', () => ({
  __esModule: true,
  default: ({ children }) => children,
}));

jest.mock('@/components/ui/ConfirmDialog', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('next/image', () => {
  const React = require('react');
  return ({ alt, unoptimized, ...props }) => React.createElement('img', { ...props, alt });
});

async function flushPromises() {
  await Promise.resolve();
}

describe('PollForm media picker', () => {
  let root;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mockMediaAPI.list.mockClear();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  test('uses the shared media picker for complex poll option assets', async () => {
    const PollForm = require('../components/polls/PollForm').default;
    const onSubmit = jest.fn();

    await act(async () => {
      root.render(React.createElement(PollForm, {
        poll: {
          title: 'Complex poll',
          type: 'complex',
          options: [
            { text: 'First option', answerType: 'custom' },
            { text: 'Second option', answerType: 'custom' },
          ],
        },
        onSubmit,
        onCancel: jest.fn(),
      }));
      await flushPromises();
    });

    expect(mockMediaAPI.list).toHaveBeenCalledWith({
      usageType: 'shared',
      entityType: 'shared',
      shared: 'true',
      limit: 18,
      search: undefined,
    });

    await act(async () => {
      container.querySelector('button[title="Reusable poll asset"]').click();
    });

    await act(async () => {
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      type: 'complex',
      options: expect.arrayContaining([
        expect.objectContaining({ text: 'First option', mediaAssetId: 77, photoUrl: '/uploads/media/poll-thumb.webp' }),
      ]),
    }));
  });
});
