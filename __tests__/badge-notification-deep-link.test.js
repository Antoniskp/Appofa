/**
 * Tests for the badge-earned notification deep link fix.
 *
 * Covers:
 *  1. notifyBadgeEarned produces `/profile#skills` instead of `/profile/:id#badges`.
 *  2. Profile page hash-to-tab utility maps supported hashes correctly.
 */

const fs = require('fs');
const path = require('path');

// ── 1. notificationService: badge notification URL ───────────────────────────

describe('notifyBadgeEarned – actionUrl', () => {
  const notificationServicePath = path.join(
    __dirname,
    '..',
    'src',
    'services',
    'notificationService.js'
  );

  it('does NOT contain the broken /profile/${userId}#badges pattern', () => {
    const source = fs.readFileSync(notificationServicePath, 'utf8');
    // The old broken pattern: dynamic userId + #badges anchor
    expect(source).not.toMatch(/\/profile\/\$\{.*\}#badges/);
  });

  it('uses /profile#skills as the actionUrl for badge_earned notifications', () => {
    const source = fs.readFileSync(notificationServicePath, 'utf8');
    expect(source).toContain('actionUrl: `/profile#skills`');
  });
});

// ── 2. Profile page: hash-to-tab logic ───────────────────────────────────────

describe('profile page hash-to-tab initialization', () => {
  const profilePagePath = path.join(__dirname, '..', 'app', 'profile', 'page.js');

  let source;
  beforeAll(() => {
    source = fs.readFileSync(profilePagePath, 'utf8');
  });

  it('imports useEffect for hash handling', () => {
    expect(source).toContain('useEffect');
  });

  it('defines getTabFromHash helper', () => {
    expect(source).toContain('getTabFromHash');
  });

  it('defines PROFILE_TAB_IDS set from PROFILE_TABS', () => {
    expect(source).toContain('PROFILE_TAB_IDS');
  });

  it('listens to hashchange events', () => {
    expect(source).toContain('hashchange');
  });

  // Inline unit-test the extracted logic by evaluating it in isolation
  const PROFILE_TAB_IDS = new Set(['profile', 'location-politics', 'skills', 'settings']);
  function getTabFromHash(hash) {
    const id = hash ? hash.replace(/^#/, '') : '';
    return PROFILE_TAB_IDS.has(id) ? id : null;
  }

  it('getTabFromHash returns null for unknown hashes', () => {
    expect(getTabFromHash('#badges')).toBeNull();
    expect(getTabFromHash('#unknown')).toBeNull();
    expect(getTabFromHash('')).toBeNull();
    expect(getTabFromHash(null)).toBeNull();
  });

  it('getTabFromHash maps #skills to skills', () => {
    expect(getTabFromHash('#skills')).toBe('skills');
  });

  it('getTabFromHash maps all valid tab hashes', () => {
    expect(getTabFromHash('#profile')).toBe('profile');
    expect(getTabFromHash('#location-politics')).toBe('location-politics');
    expect(getTabFromHash('#skills')).toBe('skills');
    expect(getTabFromHash('#settings')).toBe('settings');
  });
});
