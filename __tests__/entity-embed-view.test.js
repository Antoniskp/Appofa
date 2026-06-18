/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
  };
});

const EntityEmbedView = require('../components/embed/EntityEmbedView').default;

describe('EntityEmbedView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('renders poll embed content and open link', async () => {
    const entity = {
      id: 5,
      title: 'Δοκιμαστική δημοσκόπηση',
      description: 'Σύντομη περιγραφή',
      status: 'active',
      visibility: 'public',
      resultsVisibility: 'always',
      createdAt: '2026-05-18T00:00:00.000Z',
      location: { name: 'Αθήνα' },
      options: [
        { id: 1, text: 'Ναι', voteCount: 8 },
        { id: 2, text: 'Όχι', voteCount: 2 },
      ],
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(EntityEmbedView, { entityType: 'polls', entity }));
    });

    expect(container.textContent).toContain('Appofasi embed');
    expect(container.textContent).toContain('Δοκιμαστική δημοσκόπηση');
    expect(container.textContent).toContain('Αποτελέσματα');
    expect(container.textContent).toContain('Άνοιγμα δημοσκόπησης');

    const link = container.querySelector('a[href="/polls/5-δοκιμαστική-δημοσκόπηση"]');
    expect(link).toBeTruthy();

    await act(async () => {
      root.unmount();
    });
  });
});
