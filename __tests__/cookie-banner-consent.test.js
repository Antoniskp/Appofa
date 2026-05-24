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

    localStorage.setItem('gdpr_consent', JSON.stringify({ necessary: true }));
    expect(getGdprConsent()).toBeNull();
  });

  test('normalizes valid consent payloads', () => {
    localStorage.setItem('gdpr_consent', JSON.stringify({ analytics: true }));
    expect(getGdprConsent()).toEqual(
      expect.objectContaining({
        necessary: true,
        analytics: true,
        functional: false,
      })
    );
  });
});
