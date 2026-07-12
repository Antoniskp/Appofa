/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const useAsyncDataMock = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: () => (key, values) => {
    if (values?.count !== undefined) return `${key}:${values.count}`;
    return key;
  },
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

jest.mock('@/components/ui/Pagination', () => ({
  __esModule: true,
  default: () => React.createElement('div', null, 'pagination'),
}));

jest.mock('@/components/ui/ConfirmDialog', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('next/image', () => {
  const React = require('react');
  return ({ alt, ...props }) => React.createElement('img', { ...props, alt });
});

jest.mock('@/hooks/useAsyncData', () => ({
  useAsyncData: (...args) => useAsyncDataMock(...args),
}));

const AdminMediaPage = require('../app/admin/media/page').default;

describe('Admin media page', () => {
  let root;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    useAsyncDataMock.mockReset();

    let call = 0;
    useAsyncDataMock.mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return {
          data: {
            totalAssetCount: 2,
            totalStoredBytes: 4096,
            orphanedAssetCount: 1,
            orphanedStoredBytes: 1024,
            quotaConfig: { maxFileBytes: 1024, userQuotaBytes: 2048 },
            largestUploaders: [{ userId: 1, username: 'admin' }],
          },
          loading: false,
          refetch: jest.fn(),
        };
      }
      if (call === 2) {
        return {
          data: {
            ok: true,
            missingMediaColumns: [],
            missingArticleColumns: [],
            missingUsageTypes: [],
          },
          loading: false,
          refetch: jest.fn(),
        };
      }
      return {
        data: {
          media: [
            {
              id: 15,
              url: '/uploads/media/a.webp',
              variants: { thumbnail: { url: '/uploads/media/a.webp' } },
              uploadedBy: { username: 'admin' },
              usageType: 'shared',
              size: 1024,
              referenceCount: 2,
              isOrphaned: false,
            },
          ],
          pagination: { page: 1, totalPages: 1, total: 1 },
        },
        loading: false,
        refetch: jest.fn(),
      };
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  test('renders media stats and table rows', async () => {
    await act(async () => {
      root.render(React.createElement(AdminMediaPage));
    });

    expect(container.textContent).toContain('media_title');
    expect(container.textContent).toContain('media_schema_health_title');
    expect(container.textContent).toContain('#15');
    expect(container.textContent).toContain('media_col_references');
  });
});
