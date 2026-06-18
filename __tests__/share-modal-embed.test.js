/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next-intl', () => ({
  useTranslations: () => (key) => key,
}));

const ShareModal = require('../components/ui/ShareModal').default;

describe('ShareModal embed support', () => {
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
    document.body.innerHTML = '';
  });

  test('renders embed url and iframe snippet when embed props are provided', async () => {
    await act(async () => {
      root.render(React.createElement(ShareModal, {
        url: 'https://appofasi.gr/polls/42-demo',
        title: 'Demo poll',
        shareText: 'Share me',
        embedPath: '/embed/polls/42-demo',
        embedHeight: 620,
        onClose: jest.fn(),
      }));
    });

    const inputs = container.querySelectorAll('input[readonly]');
    expect(inputs[0].value).toBe('https://appofasi.gr/polls/42-demo');
    expect(inputs[1].value).toBe(`${window.location.origin}/embed/polls/42-demo`);

    const textarea = container.querySelector('textarea');
    expect(textarea).toBeTruthy();
    expect(textarea.value).toContain('<iframe');
    expect(textarea.value).toContain(`src="${window.location.origin}/embed/polls/42-demo"`);
    expect(textarea.value).toContain('height="620"');
  });
});
