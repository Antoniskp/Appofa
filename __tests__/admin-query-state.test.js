/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
const { useAdminQueryState } = require('../hooks/useAdminQueryState');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('admin URL filters', () => {
  let root, container, state;
  function Harness() {
    const [status, setStatus] = useAdminQueryState('status', '');
    const [page, setPage] = useAdminQueryState('page', 1);
    const [report, setReport] = useAdminQueryState('report', '');
    state = { status, setStatus, page, setPage, report, setReport };
    return null;
  }
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  const render = () => act(async () => root.render(React.createElement(Harness)));

  test('restores shared URLs and rejects invalid page values', async () => {
    window.history.replaceState(null, '', '/admin/reports?status=pending&page=3');
    await render();
    expect(state.status).toBe('pending');
    expect(state.page).toBe(3);
    window.history.replaceState(null, '', '/admin/reports?page=-2');
    await render();
    expect(state.page).toBe(1);
  });

  test('filter and page setters in the same event preserve the filter', async () => {
    window.history.replaceState(null, '', '/admin/reports?page=3&type=article');
    await render();
    state.setStatus('pending');
    state.setPage(1);
    const params = new URLSearchParams(window.location.search);
    expect(params.get('status')).toBe('pending');
    expect(params.get('type')).toBe('article');
    expect(params.has('page')).toBe(false);
  });

  test('opening and closing a report preserves the list page', async () => {
    window.history.replaceState(null, '', '/admin/reports?page=3');
    await render();
    state.setReport('42');
    expect(new URLSearchParams(window.location.search).get('page')).toBe('3');
    await render();
    state.setReport('');
    expect(window.location.search).toBe('?page=3');
  });
});
