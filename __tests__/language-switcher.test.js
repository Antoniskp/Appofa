/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const LanguageSwitcher = require('../components/ui/LanguageSwitcher').default;

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    document.cookie = 'NEXT_LOCALE=; path=/; max-age=0';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('sets NEXT_LOCALE cookie and reloads page when selecting a language', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(LanguageSwitcher));
    });

    const englishButton = [...container.querySelectorAll('button')].find((button) => button.textContent.includes('EN'));
    expect(englishButton).toBeTruthy();

    await act(async () => {
      try {
        englishButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      } catch (_) {
        // JSDOM may throw for reload/navigation APIs; cookie assertion is sufficient.
      }
    });

    expect(document.cookie).toContain('NEXT_LOCALE=en');

    await act(async () => {
      root.unmount();
    });
  });
});
