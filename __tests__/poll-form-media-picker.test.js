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

  test('a voting-intention ballot is locked after voting while status remains editable', async () => {
    const PollForm = require('../components/polls/PollForm').default;
    const onSubmit = jest.fn();
    await act(async () => {
      root.render(React.createElement(PollForm, {
        mode: 'edit', onSubmit, onCancel: jest.fn(),
        poll: { title: 'Voting intention', purpose: 'voting_intention', type: 'simple', totalVotes: 1,
          status: 'active', voteRestriction: 'authenticated', resultsVisibility: 'always',
          options: [{ id: 1, text: 'Party A' }, { id: 2, text: 'Party B' }] }
      }));
    });
    expect(container.querySelector('fieldset').disabled).toBe(true);
    expect(container.querySelector('[name="voteRestriction"]').disabled).toBe(true);
    const status = container.querySelector('[name="status"]');
    expect(status.disabled).toBe(false);
    await act(async () => {
      status.value = 'closed';
      status.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(onSubmit.mock.calls[0][0].status).toBe('closed');
    expect(onSubmit.mock.calls[0][0].options).toBeUndefined();
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

  test('clears the selected shared media asset before submit', async () => {
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

    await act(async () => {
      container.querySelector('button[title="Reusable poll asset"]').click();
    });

    const clearButton = Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent.includes('Clear selected media'));

    await act(async () => {
      clearButton.click();
    });

    await act(async () => {
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    const payload = onSubmit.mock.calls[0][0];
    expect(payload.options[0]).toEqual(expect.objectContaining({
      text: 'First option',
      mediaAssetId: null,
      photoUrl: '',
    }));
  });
});
