/** @jest-environment jsdom */

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
  statsAPI: {
    getCommunityStats: jest.fn(),
  },
  heroSettingsAPI: {
    get: jest.fn(),
    getSlides: jest.fn(),
  },
}));

jest.mock('@/hooks/useAsyncData', () => ({
  useAsyncData: jest.fn(),
}));

const { useAsyncData } = require('@/hooks/useAsyncData');
const HomeHero = require('../components/layout/HomeHero').default;

const baseStats = {
  totalUsers: 1,
  totalPolls: 2,
  totalVotes: 3,
  totalComments: 4,
};

const buildSlide = (linkUrl, linkText = 'Δες τώρα') => ({
  id: 1,
  title: 'Slide title',
  subtitle: 'Slide subtitle',
  linkUrl,
  linkText,
});

const renderHero = async (slide) => {
  let callCount = 0;
  useAsyncData.mockImplementation((_, __, options = {}) => {
    callCount += 1;
    if (callCount === 1) return { data: baseStats, loading: false };
    if (callCount === 2) {
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
    root.render(React.createElement(HomeHero));
  });

  return { container, root };
};

describe('HomeHero CTA link behavior', () => {
  afterEach(async () => {
    useAsyncData.mockReset();
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
});
