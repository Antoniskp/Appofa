/**
 * Unit tests for lib/geo/countryResolver.js
 *
 * Verifies that the priority chain (saved choice → profile → query param →
 * browser signals → IP hint) is honoured correctly.
 */

// Provide a minimal document/navigator/Intl shim for jsdom-free test env
const originalDocument = global.document;
const originalNavigator = global.navigator;
const originalIntl = global.Intl;

const setCookies = (cookieStr) => {
  global.document = {
    cookie: cookieStr,
  };
};

afterEach(() => {
  global.document = originalDocument;
  global.navigator = originalNavigator;
  global.Intl = originalIntl;
});

const {
  getSavedUserCountry,
  getDetectedCountry,
  getBrowserLocaleCountry,
  getTimezoneCountry,
  resolveCountry,
} = require('../lib/geo/countryResolver');

describe('countryResolver — getSavedUserCountry', () => {
  test('returns null when cookie is absent', () => {
    setCookies('');
    expect(getSavedUserCountry()).toBeNull();
  });

  test('returns normalised code when appofa_user_country is set', () => {
    setCookies('appofa_user_country=gr');
    expect(getSavedUserCountry()).toBe('GR');
  });

  test('ignores invalid codes (XX)', () => {
    setCookies('appofa_user_country=XX');
    expect(getSavedUserCountry()).toBeNull();
  });

  test('ignores non-ISO2 values', () => {
    setCookies('appofa_user_country=GBR');
    expect(getSavedUserCountry()).toBeNull();
  });
});

describe('countryResolver — getDetectedCountry', () => {
  test('returns null when cookie is absent', () => {
    setCookies('');
    expect(getDetectedCountry()).toBeNull();
  });

  test('returns normalised code when appofa_detected_country is set', () => {
    setCookies('appofa_detected_country=cy');
    expect(getDetectedCountry()).toBe('CY');
  });
});

describe('countryResolver — getBrowserLocaleCountry', () => {
  test('returns null when navigator is undefined', () => {
    global.navigator = undefined;
    expect(getBrowserLocaleCountry()).toBeNull();
  });

  test('extracts country tag from el-GR', () => {
    global.navigator = { language: 'el-GR' };
    expect(getBrowserLocaleCountry()).toBe('GR');
  });

  test('extracts country tag from en-US', () => {
    global.navigator = { language: 'en-US' };
    expect(getBrowserLocaleCountry()).toBe('US');
  });

  test('returns null for locale without country tag (e.g. "en")', () => {
    global.navigator = { language: 'en' };
    expect(getBrowserLocaleCountry()).toBeNull();
  });
});

describe('countryResolver — getTimezoneCountry', () => {
  test('returns GR for Europe/Athens', () => {
    global.Intl = {
      DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Europe/Athens' }) }),
    };
    expect(getTimezoneCountry()).toBe('GR');
  });

  test('returns CY for Asia/Nicosia', () => {
    global.Intl = {
      DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Asia/Nicosia' }) }),
    };
    expect(getTimezoneCountry()).toBe('CY');
  });

  test('returns null for unknown timezone', () => {
    global.Intl = {
      DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'America/New_York' }) }),
    };
    expect(getTimezoneCountry()).toBeNull();
  });
});

describe('countryResolver — resolveCountry priority chain', () => {
  beforeEach(() => {
    setCookies('');
    global.navigator = { language: 'el-GR' };
    global.Intl = {
      DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Europe/Athens' }) }),
    };
  });

  test('1. saved user choice wins over everything', () => {
    setCookies('appofa_user_country=cy; appofa_detected_country=gb');
    global.navigator = { language: 'en-GB' };
    const result = resolveCountry({ queryCountry: 'US' });
    expect(result).toEqual({ code: 'CY', source: 'saved_choice' });
  });

  test('2. profile location wins when no saved choice', () => {
    setCookies('appofa_detected_country=gb');
    const result = resolveCountry({
      user: { homeLocation: { type: 'country', code: 'GR' } },
      queryCountry: 'US',
    });
    expect(result).toEqual({ code: 'GR', source: 'profile' });
  });

  test('3. query param wins when no saved choice or profile', () => {
    setCookies('appofa_detected_country=gb');
    const result = resolveCountry({ queryCountry: 'cy' });
    expect(result).toEqual({ code: 'CY', source: 'query_param' });
  });

  test('4a. browser_signals (locale+tz agree) wins over IP hint', () => {
    setCookies('appofa_detected_country=gb');
    // locale=el-GR and tz=Europe/Athens both say GR
    const result = resolveCountry();
    expect(result).toEqual({ code: 'GR', source: 'browser_signals' });
  });

  test('4b. browser_locale alone when only locale is available', () => {
    setCookies('appofa_detected_country=gb');
    global.Intl = {
      DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'America/New_York' }) }),
    };
    const result = resolveCountry();
    expect(result).toEqual({ code: 'GR', source: 'browser_locale' });
  });

  test('5. IP hint is lowest priority fallback', () => {
    setCookies('appofa_detected_country=gb');
    global.navigator = { language: 'en' }; // no country tag
    global.Intl = {
      DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'America/New_York' }) }),
    };
    const result = resolveCountry();
    expect(result).toEqual({ code: 'GB', source: 'ip_hint' });
  });

  test('returns unknown when no signals at all', () => {
    setCookies('');
    global.navigator = { language: 'en' };
    global.Intl = {
      DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'America/New_York' }) }),
    };
    const result = resolveCountry();
    expect(result).toEqual({ code: null, source: 'unknown' });
  });

  test('saved choice is not overridden when IP says something different', () => {
    setCookies('appofa_user_country=gr; appofa_detected_country=gb');
    global.navigator = { language: 'en-GB' };
    const result = resolveCountry();
    expect(result.code).toBe('GR');
    expect(result.source).toBe('saved_choice');
  });
});
