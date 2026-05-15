/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');
const { ToastProvider } = require('../components/ToastProvider');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children)
  };
});

jest.mock('@/components/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }) => children,
}));

jest.mock('@/components/admin/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }) => children,
}));

jest.mock('@/lib/api', () => ({
  adminAPI: {
    getWorkerHealthStatus: jest.fn(),
    sendWorkerTestSnapshot: jest.fn(),
    listWorkerTokens: jest.fn(),
    createWorkerToken: jest.fn(),
    revokeWorkerToken: jest.fn(),
  }
}));

const { adminAPI } = require('@/lib/api');
const WorkerStatusPage = require('../app/admin/worker-status/page').default;

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const renderPage = async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(ToastProvider, null, React.createElement(WorkerStatusPage)));
  });
  await act(async () => {
    await flushPromises();
  });

  return { container, root };
};

describe('Admin worker status page', () => {
  let originalConfirm;

  beforeEach(() => {
    originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);
    Object.defineProperty(global.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      }
    });

    adminAPI.getWorkerHealthStatus.mockReset();
    adminAPI.sendWorkerTestSnapshot.mockReset();
    adminAPI.listWorkerTokens.mockReset();
    adminAPI.createWorkerToken.mockReset();
    adminAPI.revokeWorkerToken.mockReset();

    adminAPI.getWorkerHealthStatus.mockResolvedValue({
      success: true,
      data: {
        type: 'health_response',
        requestId: 'health-1',
        ok: true,
        service: 'appofasistis',
        time: '2026-05-15T13:50:53.418Z',
        load: 0,
        memory: { usedMB: 8370, totalMB: 16152 },
        activeTasks: 0,
        workerId: 'Iannis_Greece',
      }
    });
    adminAPI.sendWorkerTestSnapshot.mockResolvedValue({
      success: true,
      data: {
        type: 'snapshot_response',
        requestId: 'snap-1',
        ok: true,
        receivedAt: '2026-05-15T13:34:16.875Z',
        workerId: 'Iannis_Greece',
      }
    });
  });

  afterEach(() => {
    window.confirm = originalConfirm;
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('renders worker tokens section with empty state', async () => {
    adminAPI.listWorkerTokens.mockResolvedValue({
      success: true,
      data: []
    });

    const { container, root } = await renderPage();

    expect(container.textContent).toContain('Worker Tokens');
    expect(container.textContent).toContain('Manage API tokens for worker authentication');
    expect(container.textContent).toContain('No worker tokens created yet. Click \'Create Token\' to generate one.');
    expect(adminAPI.listWorkerTokens).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
  });

  test('renders worker health and snapshot response fields', async () => {
    adminAPI.listWorkerTokens.mockResolvedValue({
      success: true,
      data: []
    });

    const { container, root } = await renderPage();

    expect(container.textContent).toContain('Status: ✅ Healthy');
    expect(container.textContent).toContain('Worker ID: Iannis_Greece');
    expect(container.textContent).toContain('Service: appofasistis');
    expect(container.textContent).toContain(`Time: ${new Date('2026-05-15T13:50:53.418Z').toLocaleString()}`);
    expect(container.textContent).toContain('CPU Load: 0 (1-min avg)');
    expect(container.textContent).toContain('Memory: 8370 / 16152 MB');
    expect(container.textContent).toContain('Active Tasks: 0');

    const snapshotButton = Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Send test snapshot');
    await act(async () => {
      snapshotButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    expect(container.textContent).toContain('Status: ✅ Received');
    expect(container.textContent).toContain('Worker ID: Iannis_Greece');
    expect(container.textContent).toContain(`Received At: ${new Date('2026-05-15T13:34:16.875Z').toLocaleString()}`);

    await act(async () => {
      root.unmount();
    });
  });

  test('creates a token, shows it once, and supports copy feedback', async () => {
    adminAPI.listWorkerTokens
      .mockResolvedValueOnce({ success: true, data: [] })
      .mockResolvedValueOnce({
        success: true,
        data: [{
          id: 1,
          name: 'PC Worker #1',
          created_at: '2026-05-14T14:00:00.000Z',
          last_used_at: null,
          revoked_at: null,
        }]
      });
    adminAPI.createWorkerToken.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        name: 'PC Worker #1',
        token: 'appofa_wt_created_once_token',
      }
    });

    const { root } = await renderPage();

    const openButton = Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Create Token');
    await act(async () => {
      openButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    const nameInput = document.querySelector('input#worker-token-name');
    await act(async () => {
      const setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setValue.call(nameInput, 'PC Worker #1');
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const createButton = document.querySelector('button[form="create-worker-token-form"]');
    await act(async () => {
      createButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    expect(adminAPI.createWorkerToken).toHaveBeenCalledWith({ name: 'PC Worker #1' });
    expect(document.body.textContent).toContain('Save this token now!');
    expect(document.body.textContent).toContain('You won\'t be able to see it again.');

    const tokenInput = document.querySelector('input#created-worker-token');
    expect(tokenInput).toBeTruthy();
    expect(tokenInput.value).toBe('appofa_wt_created_once_token');
    expect(document.activeElement).toBe(tokenInput);

    const copyButton = Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Copy Token');
    await act(async () => {
      copyButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    expect(global.navigator.clipboard.writeText).toHaveBeenCalledWith('appofa_wt_created_once_token');
    expect(document.body.textContent).toContain('Copied!');

    const closeButton = Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Close');
    await act(async () => {
      closeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    expect(document.querySelector('input#created-worker-token')).toBeNull();
    expect(document.body.textContent).not.toContain('appofa_wt_created_once_token');

    await act(async () => {
      root.unmount();
    });
  });

  test('revokes an active token, refreshes the list, and shows a success toast', async () => {
    adminAPI.listWorkerTokens
      .mockResolvedValueOnce({
        success: true,
        data: [{
          id: 7,
          name: 'Worker Alpha',
          created_at: '2026-05-14T10:00:00.000Z',
          last_used_at: '2026-05-14T11:00:00.000Z',
          revoked_at: null,
        }]
      })
      .mockResolvedValueOnce({
        success: true,
        data: [{
          id: 7,
          name: 'Worker Alpha',
          created_at: '2026-05-14T10:00:00.000Z',
          last_used_at: '2026-05-14T11:00:00.000Z',
          revoked_at: '2026-05-14T12:00:00.000Z',
        }]
      });
    adminAPI.revokeWorkerToken.mockResolvedValue({
      success: true,
      data: {
        id: 7,
        revoked_at: '2026-05-14T12:00:00.000Z',
      }
    });

    const { root } = await renderPage();

    const revokeButton = Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Revoke');
    await act(async () => {
      revokeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    expect(window.confirm).toHaveBeenCalledWith(
      "Revoke token 'Worker Alpha'? This cannot be undone and will immediately invalidate the token."
    );
    expect(adminAPI.revokeWorkerToken).toHaveBeenCalledWith(7);
    expect(document.body.textContent).toContain("Token 'Worker Alpha' revoked successfully.");
    expect(document.body.textContent).toContain('Revoked');

    await act(async () => {
      root.unmount();
    });
  });
});
