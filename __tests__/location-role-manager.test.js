/** @jest-environment node */

jest.mock('@/lib/api', () => ({
  locationRoleAPI: {
    getRoles: jest.fn(),
    upsertRoles: jest.fn(),
  },
  apiRequest: jest.fn(),
}));

jest.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ error: jest.fn(), success: jest.fn() }),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key) => key,
}));

const {
  getDisplayUsername,
  mapAssigneeSearchResult,
} = require('../components/LocationRoleManager');

describe('LocationRoleManager assignee username normalization', () => {
  test('getDisplayUsername hides placeholder fallback usernames', () => {
    expect(getDisplayUsername('unknown')).toBeNull();
    expect(getDisplayUsername(' Unknown ')).toBeNull();
    expect(getDisplayUsername('')).toBeNull();
    expect(getDisplayUsername('   ')).toBeNull();
  });

  test('mapAssigneeSearchResult does not expose @unknown chip username', () => {
    const mapped = mapAssigneeSearchResult({
      id: 11,
      firstNameNative: 'Μαρία',
      lastNameNative: 'Παπαδοπούλου',
      username: 'unknown',
    });

    expect(mapped.name).toBe('Μαρία Παπαδοπούλου');
    expect(mapped.username).toBeNull();
  });

  test('mapAssigneeSearchResult preserves username-only display fallback for real usernames', () => {
    const mapped = mapAssigneeSearchResult({
      id: 22,
      firstNameNative: '',
      lastNameNative: '',
      username: 'valid_user',
    });

    expect(mapped.name).toBe('valid_user');
    expect(mapped.username).toBe('valid_user');
  });
});
