/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockRouter = { replace: jest.fn() };
const mockAddToast = jest.fn();
const useAsyncDataMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('@/components/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }) => children,
}));

jest.mock('@/components/admin/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }) => children,
}));

jest.mock('@/components/admin/AdminHeader', () => ({
  __esModule: true,
  default: ({ title, subtitle }) => React.createElement('div', null, `${title} ${subtitle}`),
}));

jest.mock('@/components/ui/SkeletonLoader', () => ({
  __esModule: true,
  default: () => React.createElement('div', null, 'loading'),
}));

jest.mock('@/components/ui/Modal', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }) => React.createElement('div', null, children),
    ConfirmDialog: ({ isOpen, message, confirmText, onConfirm, onClose }) => (isOpen
      ? React.createElement('div', { 'data-testid': 'confirm-dialog' },
        React.createElement('p', null, message),
        React.createElement('button', { type: 'button', onClick: () => { onConfirm(); onClose(); } }, `confirm:${confirmText}`))
      : null),
  };
});

jest.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ isAdmin: true }),
}));

jest.mock('@/hooks/useAsyncData', () => ({
  useAsyncData: (...args) => useAsyncDataMock(...args),
}));

jest.mock('@/lib/api', () => ({
  addIpRule: jest.fn(),
  listIpRules: jest.fn(),
  geoAdminAPI: {
    getVisits: jest.fn(),
    getCountries: jest.fn(),
    listFunding: jest.fn(),
    createFunding: jest.fn(),
    updateFunding: jest.fn(),
    deleteFunding: jest.fn(),
    clearVisits: jest.fn(),
  },
}));

jest.mock('@/lib/api/geoAccess', () => ({
  addCountryRule: jest.fn(),
  getSettings: jest.fn(),
  listCountryRules: jest.fn(),
  removeCountryRule: jest.fn(),
  updateSetting: jest.fn(),
}));

const AdminGeoPage = require('../app/admin/geo/page').default;
const geoAccessApi = require('@/lib/api/geoAccess');
const libApi = require('@/lib/api');

const findButton = (container, text) =>
  Array.from(container.querySelectorAll('button')).find((button) => button.textContent.trim() === text);

const click = async (element) => {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();
  });
};

const typeInto = async (input, value) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await flushPromises();
  });
};

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const visitsData = {
  totalVisits: 12,
  byCountry: [{ countryCode: 'GR', visits: 12, authenticated: 3, diaspora: 0 }],
  topPaths: [
    {
      path: '/admin/geo/very/long/path/that/should/stay/on/a/single/line/with/an/ellipsis?filter=traffic&section=recent-visits',
      visits: 5,
    },
  ],
  trafficSummary: { human: 1, crawler: 1 },
  crawlerGroups: [
    { key: 'human', label: 'Human / unknown', trafficType: 'human', visits: 1, lastSeen: '2026-06-20T10:20:30.000Z' },
    { key: 'google', label: 'Google', trafficType: 'crawler', visits: 1, lastSeen: '2026-06-20T10:19:30.000Z' },
  ],
  ipGroups: [
    { ipAddress: '203.0.113.45', countryCode: 'GR', countryName: 'Greece', trafficType: 'human', crawlerLabel: 'Human / unknown', visits: 1 },
    { ipAddress: '66.249.66.1', countryCode: 'US', countryName: 'United States', trafficType: 'crawler', crawlerLabel: 'Google', visits: 1 },
  ],
  recentVisits: [
    {
      countryCode: 'GR',
      countryName: 'Greece',
      username: 'antonis',
      isAuthenticated: true,
      trafficType: 'human',
      crawlerLabel: 'Human / unknown',
      path: '/country/gr/some/very/long/path/that/needs/truncation/in/the/recent/visits/table?view=full&mode=admin',
      ipAddress: '203.0.113.45',
      createdAt: '2026-06-20T10:20:30.000Z',
    },
    {
      countryCode: 'US',
      countryName: 'United States',
      username: null,
      isAuthenticated: false,
      trafficType: 'crawler',
      crawlerLabel: 'Google',
      path: '/robots.txt',
      ipAddress: '66.249.66.1',
      createdAt: '2026-06-20T10:19:30.000Z',
    },
  ],
};
const emptyArray = [];
const countryRulesData = [
  {
    id: 7,
    countryCode: 'RU',
    reason: 'Blocked',
    redirectPath: '/blocked/countries/russia/with/a/very/long/path/value/that/should/truncate/in/the/table',
    createdBy: { username: 'admin' },
    createdAt: '2026-06-20T11:20:30.000Z',
  },
];
const mockResponseByHookOrder = [
  { data: visitsData, loading: false, refetch: jest.fn() },
  { data: emptyArray, loading: false, refetch: jest.fn() },
  { data: emptyArray, loading: false, refetch: jest.fn() },
  { data: countryRulesData, loading: false, refetch: jest.fn() },
  { data: emptyArray, loading: false, refetch: jest.fn() },
  { data: emptyArray, loading: false, refetch: jest.fn() },
];

const setupAsyncDataMocks = () => {
  let callCount = 0;
  useAsyncDataMock.mockImplementation((fetcher, deps) => {
    callCount += 1;
    if ((callCount - 1) % mockResponseByHookOrder.length === 0) {
      const activityGroups = visitsData.recentVisits.filter(row => row.trafficType === deps[2])
        .map(row => ({ ...row, key: row.ipAddress, viewCount: 1 }));
      return { ...mockResponseByHookOrder[0], data: { ...visitsData, activityGroups, activityGroupCount: activityGroups.length } };
    }
    return mockResponseByHookOrder[(callCount - 1) % mockResponseByHookOrder.length];
  });
};

describe('Admin geo page traffic tables', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mockRouter.replace.mockReset();
    mockAddToast.mockReset();
    useAsyncDataMock.mockReset();
    setupAsyncDataMocks();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  test('truncates long paths in traffic tables and keeps hover titles, nowrap dates, and scan-friendly IPs', async () => {
    await act(async () => {
      root.render(React.createElement(AdminGeoPage));
      await flushPromises();
    });

    const topPath = '/admin/geo/very/long/path/that/should/stay/on/a/single/line/with/an/ellipsis?filter=traffic&section=recent-visits';
    const recentPath = '/country/gr/some/very/long/path/that/needs/truncation/in/the/recent/visits/table?view=full&mode=admin';
    const topPathNode = container.querySelector(`[title="${topPath}"]`);
    const recentPathNode = container.querySelector(`[title="${recentPath}"]`);
    const ipCell = Array.from(container.querySelectorAll('td')).find((cell) => cell.textContent === '203.0.113.45');
    const recentDateCell = Array.from(container.querySelectorAll('td')).find(
      (cell) => cell.textContent === new Date('2026-06-20T10:20:30.000Z').toLocaleString('el-GR')
    );

    expect(topPathNode).toBeTruthy();
    expect(topPathNode.className).toContain('truncate');
    expect(topPathNode.className).toContain('whitespace-nowrap');
    expect(recentPathNode).toBeTruthy();
    expect(recentPathNode.className).toContain('truncate');
    expect(recentPathNode.className).toContain('whitespace-nowrap');
    expect(ipCell).toBeTruthy();
    expect(ipCell.className).toContain('font-mono');
    expect(ipCell.className).toContain('text-xs');
    expect(ipCell.className).toContain('whitespace-nowrap');
    expect(recentDateCell).toBeTruthy();
    expect(recentDateCell.className).toContain('whitespace-nowrap');
  });

  test('groups crawlers and filters recent visits away from real traffic by default', async () => {
    await act(async () => {
      root.render(React.createElement(AdminGeoPage));
      await flushPromises();
    });

    expect(container.textContent).toContain('Αναγνωρισμένα ρομπότ');
    expect(container.textContent).toContain('Καταγεγραμμένες προβολές');
    expect(container.textContent).toContain('Εμφανίζονται 1 από 1 ομάδες');
    expect(container.textContent).toContain('έως 100');
    expect(container.textContent).toContain('Google');
    expect(container.textContent).toContain('Διευθύνσεις IP με τις περισσότερες προβολές');
    expect(container.textContent).toContain('66.249.66.1');
    expect(container.textContent).not.toContain('/robots.txt');

    const crawlersButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Ρομπότ');
    await act(async () => {
      crawlersButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    expect(container.textContent).toContain('/robots.txt');
    expect(crawlersButton.getAttribute('aria-pressed')).toBe('true');
  });

  test('also truncates long redirect paths in access rules and keeps access-rule dates on one line', async () => {
    await act(async () => {
      root.render(React.createElement(AdminGeoPage));
      await flushPromises();
    });

    const accessRulesButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Κανόνες Πρόσβασης');

    await act(async () => {
      accessRulesButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    const redirectPath = '/blocked/countries/russia/with/a/very/long/path/value/that/should/truncate/in/the/table';
    const redirectPathNode = container.querySelector(`[title="${redirectPath}"]`);
    const accessDateCell = Array.from(container.querySelectorAll('td')).find(
      (cell) => cell.textContent === new Date('2026-06-20T11:20:30.000Z').toLocaleString('el-GR')
    );

    expect(redirectPathNode).toBeTruthy();
    expect(redirectPathNode.className).toContain('truncate');
    expect(redirectPathNode.className).toContain('whitespace-nowrap');
    expect(accessDateCell).toBeTruthy();
    expect(accessDateCell.className).toContain('whitespace-nowrap');
  });

  test('shows Greek country names and filters the traffic tab by clicking a country', async () => {
    await act(async () => {
      root.render(React.createElement(AdminGeoPage));
      await flushPromises();
    });

    expect(container.textContent).toContain('Ελλάδα');
    const greeceButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.title === 'Φιλτράρισμα σε αυτή τη χώρα'
    );
    expect(greeceButton).toBeTruthy();

    await click(greeceButton);

    const visitsCalls = useAsyncDataMock.mock.calls.filter((_, index) => index % mockResponseByHookOrder.length === 0);
    const lastDeps = visitsCalls[visitsCalls.length - 1][1];
    expect(lastDeps[lastDeps.length - 1]).toBe('GR');
    expect(container.textContent).toContain('Χώρα: Ελλάδα');

    await click(container.querySelector('[aria-label="Αφαίρεση φίλτρου χώρας"]'));
    expect(container.textContent).not.toContain('Χώρα: Ελλάδα');
  });

  test('asks for confirmation before blocking an IP', async () => {
    libApi.addIpRule.mockResolvedValue({ success: true });
    await act(async () => {
      root.render(React.createElement(AdminGeoPage));
      await flushPromises();
    });

    const groupToggle = Array.from(container.querySelectorAll('label'))
      .find((label) => label.textContent.includes('Ομαδοποίηση')).querySelector('input');
    await click(groupToggle);
    const visitsCallsBefore = useAsyncDataMock.mock.calls.length;
    await click(findButton(container, 'Λεπτομέρειες'));
    // Ungrouped rows are already loaded: expanding must not change the visits query deps.
    const visitsCalls = useAsyncDataMock.mock.calls.slice(visitsCallsBefore - mockResponseByHookOrder.length)
      .filter((_, index) => index % mockResponseByHookOrder.length === 0).map((call) => call[1]);
    expect(visitsCalls[visitsCalls.length - 1]).toEqual(visitsCalls[0]);
    await click(findButton(container, 'Αποκλεισμός IP'));

    expect(libApi.addIpRule).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="confirm-dialog"]').textContent).toContain('203.0.113.45');

    await click(findButton(container, 'confirm:Αποκλεισμός'));
    expect(libApi.addIpRule).toHaveBeenCalledWith('203.0.113.45', 'blacklist', 'Blocked from geo admin');
  });

  test('refuses to block Greece and confirms before blocking another country', async () => {
    geoAccessApi.addCountryRule.mockResolvedValue({ success: true });
    await act(async () => {
      root.render(React.createElement(AdminGeoPage));
      await flushPromises();
    });

    await click(findButton(container, 'Κανόνες Πρόσβασης'));
    const codeInput = container.querySelector('[aria-label="Κωδικός χώρας"]');

    await typeInto(codeInput, 'GR');
    await click(findButton(container, '➕ Προσθήκη'));
    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('δεν μπορεί να αποκλειστεί'), { type: 'error' });
    expect(container.querySelector('[data-testid="confirm-dialog"]')).toBeNull();

    await typeInto(codeInput, 'FR');
    await click(findButton(container, '➕ Προσθήκη'));
    expect(geoAccessApi.addCountryRule).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="confirm-dialog"]').textContent).toContain('Γαλλία');

    await click(findButton(container, 'confirm:Αποκλεισμός'));
    expect(geoAccessApi.addCountryRule).toHaveBeenCalledWith('FR', null, null);
  });

  test('shows Greek access actions and warns when blocking unknown countries', async () => {
    await act(async () => {
      root.render(React.createElement(AdminGeoPage));
      await flushPromises();
    });

    await click(findButton(container, 'Κανόνες Πρόσβασης'));
    const select = container.querySelector('select');
    expect(Array.from(select.options).map((option) => option.textContent)).toEqual(['Επιτρέπεται', 'Αποκλεισμός', 'Ανακατεύθυνση']);

    await act(async () => {
      select.value = 'block';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await flushPromises();
    });
    expect(container.textContent).toContain('μπορεί να κόψει πραγματικούς χρήστες');

    await click(findButton(container, 'Αποθήκευση'));
    expect(geoAccessApi.updateSetting).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="confirm-dialog"]')).toBeTruthy();
  });
});
