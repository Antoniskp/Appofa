/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next-intl', () => ({
  useTranslations: () => (key) => key,
}));

const CookieBanner = require('../components/layout/CookieBanner').default;

function getButton(container, text) {
  return Array.from(container.querySelectorAll('button')).find((button) => button.textContent === text);
}

async function click(element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

describe('CookieBanner component', () => {
  let container;
  let root;

  beforeEach(() => {
    localStorage.clear();
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

  test('first visit shows banner and preferences default to analytics enabled', async () => {
    await act(async () => {
      root.render(React.createElement(CookieBanner));
    });

    expect(container.querySelector('[role="dialog"]')).toBeTruthy();
    await click(getButton(container, 'manage_preferences'));

    const switches = container.querySelectorAll('[role="switch"]');
    expect(switches[1].getAttribute('aria-checked')).toBe('true');
  });

  test('reopening cookie settings can opt back in and out', async () => {
    await act(async () => {
      root.render(React.createElement(CookieBanner));
    });

    await click(getButton(container, 'reject_non_essential'));
    expect(JSON.parse(localStorage.getItem('gdpr_consent'))).toEqual(
      expect.objectContaining({ analytics: false, functional: false })
    );

    await act(async () => {
      window.dispatchEvent(new CustomEvent('open-cookie-settings'));
    });
    await click(container.querySelectorAll('[role="switch"]')[1]);
    await click(getButton(container, 'save_preferences'));
    expect(JSON.parse(localStorage.getItem('gdpr_consent'))).toEqual(
      expect.objectContaining({ analytics: true })
    );

    await act(async () => {
      window.dispatchEvent(new CustomEvent('open-cookie-settings'));
    });
    await click(container.querySelectorAll('[role="switch"]')[1]);
    await click(getButton(container, 'save_preferences'));
    expect(JSON.parse(localStorage.getItem('gdpr_consent'))).toEqual(
      expect.objectContaining({ analytics: false })
    );
  });
});
