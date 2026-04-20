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

  test('reads NEXT_LOCALE cookie and highlights the selected language', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    document.cookie = 'NEXT_LOCALE=en; path=/';

    await act(async () => {
      root.render(React.createElement(LanguageSwitcher));
    });

    const englishButton = [...container.querySelectorAll('button')].find((button) => button.textContent.includes('EN'));
    expect(englishButton).toBeTruthy();
    expect(englishButton.className).toContain('font-bold');

    await act(async () => {
      root.unmount();
    });
  });
});
