/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');
const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const collectLeafKeys = (value, prefix = '') => {
  if (Array.isArray(value) || value === null || typeof value !== 'object') {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, nested]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return collectLeafKeys(nested, nextPrefix);
  });
};

describe('Romanian i18n wiring', () => {
  const i18nConstantsPath = path.join(__dirname, '..', 'lib', 'constants', 'i18n.js');
  const layoutPath = path.join(__dirname, '..', 'app', 'layout.js');
  const geoTrackerPath = path.join(__dirname, '..', 'components', 'layout', 'GeoTracker.js');

  test('registers Romanian in locale constants and key locale call-sites', () => {
    const constantsSource = fs.readFileSync(i18nConstantsPath, 'utf8');
    const layoutSource = fs.readFileSync(layoutPath, 'utf8');
    const geoTrackerSource = fs.readFileSync(geoTrackerPath, 'utf8');

    expect(constantsSource).toContain("SUPPORTED_LOCALES = ['el', 'en', 'ro']");
    expect(layoutSource).toContain('ro: SITE_URL');
    expect(geoTrackerSource).toContain("['el', 'en', 'ro']");
  });

  test('keeps Romanian message schema aligned with English', () => {
    const en = require('../messages/en.json');
    const ro = require('../messages/ro.json');

    const enKeys = collectLeafKeys(en).sort();
    const roKeys = collectLeafKeys(ro).sort();

    expect(roKeys).toEqual(enKeys);
  });
});

describe('LanguageSwitcher Romanian option', () => {
  const LanguageSwitcher = require('../components/ui/LanguageSwitcher').default;
  const languageSwitcherPath = path.join(__dirname, '..', 'components', 'ui', 'LanguageSwitcher.js');

  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root.unmount();
      });
    }
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  test('renders Romanian option in the switcher UI', async () => {
    await act(async () => {
      root.render(React.createElement(LanguageSwitcher));
    });

    const roButton = container.querySelector('button[aria-label="Română"]');
    expect(roButton).toBeTruthy();
    expect(roButton.textContent).toContain('🇷🇴');
    expect(roButton.textContent).toContain('RO');
  });

  test('persists locale selection through NEXT_LOCALE cookie logic', () => {
    const source = fs.readFileSync(languageSwitcherPath, 'utf8');
    expect(source).toContain('NEXT_LOCALE=');
    expect(source).toContain('window.location.reload()');
  });
});
