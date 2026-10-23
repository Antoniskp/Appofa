/** @jest-environment <rootDir>/jest-jsdom-env.js */
/* global document, window, MouseEvent */

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

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(() => ({ user: null, loading: false })),
}));

jest.mock('@/lib/api', () => ({
  heroSettingsAPI: {
    get: jest.fn(),
    getSlides: jest.fn(),
  },
  pollAPI: {
    vote: jest.fn(),
  },
}));

jest.mock('@/hooks/useAsyncData', () => ({
  useAsyncData: jest.fn(),
}));

const { useAsyncData } = require('@/hooks/useAsyncData');
const { useAuth } = require('@/lib/auth-context');
const { pollAPI } = require('@/lib/api');
const HomeHero = require('../components/layout/HomeHero').default;

const buildSlide = (linkUrl, linkText = 'Δες τώρα') => ({
  id: 1,
  title: 'Slide title',
  subtitle: 'Slide subtitle',
  linkUrl,
  linkText,
});

const renderHero = async (slide, props = {}) => {
  let callCount = 0;
  useAsyncData.mockImplementation((_, __, options = {}) => {
    callCount += 1;
    if (callCount === 1) {
      if (typeof options.onSuccess === 'function') {
        options.onSuccess({ success: false });
      }
      return { data: null, loading: false };
    }
    const slides = Array.isArray(slide) ? slide : (slide ? [slide] : []);
    return { data: slides, loading: false };
  });

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(HomeHero, props));
  });

  return { container, root };
};

describe('HomeHero CTA link behavior', () => {
  afterEach(async () => {
    useAsyncData.mockReset();
    useAuth.mockReset();
    pollAPI.vote.mockReset();
    useAuth.mockReturnValue({ user: null, loading: false });
    document.body.innerHTML = '';
  });

  test('renders internal CTA links without opening a new tab', async () => {
    const { container, root } = await renderHero(buildSlide('/polls'));
    const ctaLink = container.querySelector('a[href="/polls"]');

    expect(ctaLink).toBeTruthy();
    expect(ctaLink.getAttribute('target')).toBeNull();
    expect(ctaLink.getAttribute('rel')).toBeNull();

    await act(async () => {
      root.unmount();
    });
  });

  test('uses a stable headline and primary actions even when slides contain promotional claims', async () => {
    const { container, root } = await renderHero(buildSlide('https://example.com'));
    expect(container.querySelector('h1').textContent).toBe('Δες τι συμβαίνει. Πάρε θέση. Πρότεινε λύσεις.');
    expect(container.querySelector('a[href="/locations"]')).toBeTruthy();
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Δεν αποτελούν επίσημες αποφάσεις');
    await act(async () => root.unmount());
  });

  test('lets users vote in the featured poll without navigating away', async () => {
    const featuredPoll = {
      id: 42,
      title: 'Ποιο μοντέλο συμμετοχής σε εκφράζει περισσότερο;',
      description: 'Διάλεξε τι σε εκφράζει.',
      status: 'active',
      voteRestriction: 'anyone',
      options: [
        { id: 1, text: 'Περισσότερη άμεση δημοκρατία', voteCount: 2 },
        { id: 2, text: 'Το υπάρχον κομματικό σύστημα', voteCount: 1 },
      ],
    };
    pollAPI.vote.mockResolvedValue({
      success: true,
      data: { voteCounts: { 1: 3, 2: 1 } },
    });

    const { container, root } = await renderHero(buildSlide('/polls'), { featuredPoll });
    const voteButton = [...container.querySelectorAll('button')]
      .find((button) => button.textContent.includes('Περισσότερη άμεση δημοκρατία'));

    expect(voteButton).toBeTruthy();
    expect(voteButton.closest('a')).toBeNull();
    expect(container.querySelector('a[href="/polls/42"]').textContent).toContain('Αποτελέσματα');

    await act(async () => {
      voteButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(pollAPI.vote).toHaveBeenCalledWith(42, 1);
    expect(container.textContent).toContain('75%');
    expect(container.textContent).toContain('4 ψήφοι');

    await act(async () => {
      root.unmount();
    });
  });

  test('shows primary actions to guests', async () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    const { container, root } = await renderHero(buildSlide('/polls'));

    expect(container.textContent).toContain('Ψήφισε σε ένα θέμα');
    expect(container.querySelector('a[href="/register"]')).toBeFalsy();
    expect(container.querySelector('a[href="/locations"]')).toBeTruthy();
    expect(container.querySelector('a[href="/polls?voteRestriction=anyone"]')).toBeFalsy();
    expect(container.querySelector('a[href="/polls"]')).toBeTruthy(); // slide CTA only
    expect(container.textContent).not.toContain('Γίνε Moderator');

    await act(async () => {
      root.unmount();
    });
  });

  test('links returning users to their area and followed issues', async () => {
    useAuth.mockReturnValue({
      user: {
        role: 'admin',
        username: 'admin-user',
        homeLocation: { slug: 'athens' },
      },
      loading: false,
    });
    const { container, root } = await renderHero(buildSlide('/suggestions'));

    expect(container.querySelector('a[href="/locations/athens"]')).toBeTruthy();
    expect(container.querySelector('a[href="/polls"]')).toBeTruthy();
    expect(container.querySelector('a[href="/admin"]')).toBeFalsy();
    expect(container.querySelector('a[href="/following"]')).toBeTruthy();
    expect(container.textContent).not.toContain('Admin / Moderator');

    await act(async () => {
      root.unmount();
    });
  });
});
