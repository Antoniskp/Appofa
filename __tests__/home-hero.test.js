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

  test('keeps external CTA links opening in a new tab', async () => {
    const { container, root } = await renderHero(buildSlide('https://example.com'));
    const ctaLink = container.querySelector('a[href="https://example.com"]');

    expect(ctaLink).toBeTruthy();
    expect(ctaLink.getAttribute('target')).toBe('_blank');
    expect(ctaLink.getAttribute('rel')).toBe('noopener noreferrer');

    await act(async () => {
      root.unmount();
    });
  });

  test('treats same-origin absolute CTA links as internal navigation', async () => {
    const sameOriginUrl = `${window.location.origin}/polls?tab=open#latest`;
    const { container, root } = await renderHero(buildSlide(sameOriginUrl));
    const ctaLink = [...container.querySelectorAll('a')].find((anchor) => anchor.textContent.includes('Δες τώρα'));

    expect(ctaLink).toBeTruthy();
    expect(ctaLink.getAttribute('href')).toBe('/polls?tab=open#latest');
    expect(ctaLink.getAttribute('target')).toBeNull();
    expect(ctaLink.getAttribute('rel')).toBeNull();

    await act(async () => {
      root.unmount();
    });
  });

  test('keeps CTA wrapper hidden when linkUrl is not internal or external', async () => {
    const { container, root } = await renderHero(buildSlide('polls'));
    const wrapper = container.querySelector('div.mb-3.transition-opacity.duration-500');

    expect(wrapper).toBeTruthy();
    expect(wrapper.className).toContain('opacity-0');
    expect(wrapper.className).toContain('pointer-events-none');

    await act(async () => {
      root.unmount();
    });
  });

  test('keeps arrow navigation row rendered but invisible with a single slide', async () => {
    const { container, root } = await renderHero(buildSlide('/polls'));
    const prevButton = container.querySelector('button[aria-label="Προηγούμενο slide"]');

    expect(prevButton).toBeTruthy();
    expect(prevButton.parentElement.className).toContain('invisible');

    await act(async () => {
      root.unmount();
    });
  });

  test('shows arrow navigation row when multiple slides are available', async () => {
    const { container, root } = await renderHero([
      buildSlide('/polls', 'Δες τώρα'),
      { ...buildSlide('/news', 'Δες περισσότερα'), id: 2, title: 'Second slide' },
    ]);
    const prevButton = container.querySelector('button[aria-label="Προηγούμενο slide"]');

    expect(prevButton).toBeTruthy();
    expect(prevButton.parentElement.className).not.toContain('invisible');

    await act(async () => {
      root.unmount();
    });
  });

  test('changes headline and subtitle with the active slide', async () => {
    const { container, root } = await renderHero([
      { ...buildSlide('/polls'), id: 1, title: 'First hero title', subtitle: 'First hero subtitle' },
      { ...buildSlide('/news'), id: 2, title: 'Second hero title', subtitle: 'Second hero subtitle' },
    ]);

    expect(container.textContent).toContain('First hero title');
    expect(container.textContent).toContain('First hero subtitle');

    const arrowRow = container.querySelector('div.flex.items-center.gap-3.mb-4');
    const buttons = arrowRow.querySelectorAll('button');
    await act(async () => {
      buttons[buttons.length - 1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Second hero title');
    expect(container.textContent).toContain('Second hero subtitle');
    expect(container.textContent).not.toContain('First hero title');

    await act(async () => {
      root.unmount();
    });
  });

  test('keeps a fixed slide text frame so hero height does not jump between slides', async () => {
    const { container, root } = await renderHero([
      {
        ...buildSlide('/polls'),
        id: 1,
        title: 'Short title',
        subtitle: 'Short subtitle',
      },
      {
        ...buildSlide('/news'),
        id: 2,
        title: 'A much longer hero title that should be clamped instead of pushing the page down',
        subtitle: 'A longer subtitle that simulates an admin-managed hero slide with more text than the default slide.',
      },
    ]);

    const slideFrame = container.querySelector('[aria-live="polite"]');
    const headline = slideFrame.querySelector('h1');

    expect(slideFrame.className).toContain('h-[15rem]');
    expect(slideFrame.className).toContain('md:h-[16rem]');
    expect(slideFrame.className).toContain('lg:h-[17rem]');
    expect(slideFrame.className).not.toContain('min-h');
    expect(headline.className).toContain('line-clamp-2');

    await act(async () => {
      root.unmount();
    });
  });

  test('does not render the old static live panel', async () => {
    const { container, root } = await renderHero(buildSlide('/polls'));

    expect(container.textContent).not.toContain('Ζωντανή εικόνα');
    expect(container.textContent).not.toContain('Η συμμετοχή γίνεται πράξη');
    expect(container.textContent).not.toContain('Τοπική δράση');
    expect(container.textContent).not.toContain('Λύσεις πολιτών');

    await act(async () => {
      root.unmount();
    });
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
    expect(container.querySelector('a[href^="/polls/42"]')).toBeFalsy();

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

  test('keeps fixed homepage action links out of the guest hero', async () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    const { container, root } = await renderHero(buildSlide('/polls'));

    expect(container.textContent).toContain('Ενημέρωση · Συμμετοχή · Αποφάσεις');
    expect(container.querySelector('a[href="/register"]')).toBeFalsy();
    expect(container.querySelector('a[href="/locations"]')).toBeFalsy();
    expect(container.querySelector('a[href="/polls?voteRestriction=anyone"]')).toBeFalsy();
    expect(container.querySelector('a[href="/polls"]')).toBeTruthy(); // slide CTA only
    expect(container.textContent).not.toContain('Γίνε Moderator');

    await act(async () => {
      root.unmount();
    });
  });

  test('keeps fixed homepage action links out of the logged-in hero', async () => {
    useAuth.mockReturnValue({
      user: {
        role: 'admin',
        username: 'admin-user',
        homeLocation: { slug: 'athens' },
      },
      loading: false,
    });
    const { container, root } = await renderHero(buildSlide('/suggestions'));

    expect(container.querySelector('a[href="/locations/athens"]')).toBeFalsy();
    expect(container.querySelector('a[href="/polls"]')).toBeFalsy();
    expect(container.querySelector('a[href="/admin"]')).toBeFalsy();
    expect(container.querySelector('a[href="/suggestions"]')).toBeTruthy(); // slide CTA only
    expect(container.textContent).not.toContain('Admin / Moderator');

    await act(async () => {
      root.unmount();
    });
  });
});
