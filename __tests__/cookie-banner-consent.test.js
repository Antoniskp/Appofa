/** @jest-environment jsdom */

jest.mock('next-intl', () => ({
  useTranslations: () => () => '',
}));

const { getGdprConsent } = require('../components/layout/CookieBanner');

describe('CookieBanner consent parsing', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('returns null for malformed legacy consent payloads', () => {
    localStorage.setItem('gdpr_consent', JSON.stringify(true));
    expect(getGdprConsent()).toBeNull();
  });

  test('normalizes partial legacy payloads with default-on analytics', () => {
    localStorage.setItem('gdpr_consent', JSON.stringify({ necessary: true }));
    expect(getGdprConsent()).toEqual(
      expect.objectContaining({
        necessary: true,
        analytics: true,
        functional: false,
      })
    );
  });

  test('normalizes valid consent payloads while preserving explicit choices', () => {
    localStorage.setItem('gdpr_consent', JSON.stringify({ analytics: true }));
    expect(getGdprConsent()).toEqual(
      expect.objectContaining({
        necessary: true,
        analytics: true,
        functional: false,
      })
    );

    localStorage.setItem('gdpr_consent', JSON.stringify({ analytics: false, functional: true }));
    expect(getGdprConsent()).toEqual(
      expect.objectContaining({
        necessary: true,
        analytics: false,
        functional: true,
      })
    );
  });
});
