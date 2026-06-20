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
    ConfirmDialog: ({ children }) => React.createElement('div', null, children),
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
  recentVisits: [
    {
      countryCode: 'GR',
      countryName: 'Greece',
      username: 'antonis',
      isAuthenticated: true,
      path: '/country/gr/some/very/long/path/that/needs/truncation/in/the/recent/visits/table?view=full&mode=admin',
      ipAddress: '203.0.113.45',
      createdAt: '2026-06-20T10:20:30.000Z',
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
  useAsyncDataMock.mockImplementation(() => {
    callCount += 1;
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
});
