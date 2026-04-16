// Tests for Location page tab navigation logic

const VALID_TABS = ['polls', 'news', 'articles', 'users', 'suggestions', 'persons', 'elections'];
const DEFAULT_TAB = 'polls';

/**
 * Replicates the tab-resolution logic from app/locations/[slug]/page.js:
 *   const activeTab = VALID_TABS.includes(rawTab) ? rawTab : DEFAULT_TAB;
 */
function resolveTab(rawTab) {
  return VALID_TABS.includes(rawTab) ? rawTab : DEFAULT_TAB;
}

describe('Location page tab navigation', () => {
  describe('VALID_TABS order', () => {
    it('should have polls as the first tab', () => {
      expect(VALID_TABS[0]).toBe('polls');
    });

    it('should have news as the second tab', () => {
      expect(VALID_TABS[1]).toBe('news');
    });

    it('should have articles as the third tab', () => {
      expect(VALID_TABS[2]).toBe('articles');
    });

    it('should have users as the fourth tab', () => {
      expect(VALID_TABS[3]).toBe('users');
    });

    it('should have suggestions as the fifth tab', () => {
      expect(VALID_TABS[4]).toBe('suggestions');
    });

    it('should have persons as the sixth tab', () => {
      expect(VALID_TABS[5]).toBe('persons');
    });

    it('should have elections as the seventh tab', () => {
      expect(VALID_TABS[6]).toBe('elections');
    });

    it('should contain exactly seven tabs', () => {
      expect(VALID_TABS).toHaveLength(7);
    });
  });

  describe('DEFAULT_TAB', () => {
    it('should default to polls', () => {
      expect(DEFAULT_TAB).toBe('polls');
    });
  });

  describe('resolveTab (query-param tab selection)', () => {
    it('should resolve a valid "polls" param to "polls"', () => {
      expect(resolveTab('polls')).toBe('polls');
    });

    it('should resolve a valid "news" param to "news"', () => {
      expect(resolveTab('news')).toBe('news');
    });

    it('should resolve a valid "articles" param to "articles"', () => {
      expect(resolveTab('articles')).toBe('articles');
    });

    it('should resolve a valid "users" param to "users"', () => {
      expect(resolveTab('users')).toBe('users');
    });

    it('should resolve a valid "suggestions" param to "suggestions"', () => {
      expect(resolveTab('suggestions')).toBe('suggestions');
    });

    it('should resolve a valid "persons" param to "persons"', () => {
      expect(resolveTab('persons')).toBe('persons');
    });

    it('should resolve a valid "elections" param to "elections"', () => {
      expect(resolveTab('elections')).toBe('elections');
    });

    it('should fall back to default for an unknown tab param', () => {
      expect(resolveTab('unknown')).toBe(DEFAULT_TAB);
    });

    it('should fall back to default when param is null (no ?tab= in URL)', () => {
      expect(resolveTab(null)).toBe(DEFAULT_TAB);
    });

    it('should fall back to default when param is undefined', () => {
      expect(resolveTab(undefined)).toBe(DEFAULT_TAB);
    });

    it('should fall back to default when param is an empty string', () => {
      expect(resolveTab('')).toBe(DEFAULT_TAB);
    });
  });
});
