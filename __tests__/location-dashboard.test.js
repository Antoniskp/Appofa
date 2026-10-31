/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...props }) => require('react').createElement('a', { href, ...props }, children) }));
jest.mock('@/lib/api/calendar', () => ({ calendarAPI: { list: jest.fn() } }));
const { calendarAPI } = require('@/lib/api/calendar');
const Dashboard = require('../components/locations/LocationDashboard').default;

describe('Location dashboard', () => {
  let container, root;
  const props = { location: { id: 3, slug: 'town' } };
  beforeEach(() => { jest.clearAllMocks(); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  test('loads a location-scoped agenda and only links to published cameras', async () => {
    calendarAPI.list.mockResolvedValue({ success: true, data: [{ id: 'event:1', title: 'Town meeting', start: '2026-10-25T10:00:00Z', timezone: 'Europe/Athens', href: '/events/1' }] });
    await act(async () => root.render(React.createElement(Dashboard, { ...props, sections: [{ type: 'webcams', isPublished: false, content: { webcams: [{}] } }] })));
    expect(calendarAPI.list).toHaveBeenCalledWith(expect.objectContaining({ locationId: 3, view: 'public', period: 'upcoming' }));
    expect(container.querySelector('a[href="/events/1"]')).toBeTruthy();
    expect(container.querySelector('a[href="#location-cameras"]')).toBeNull();
    expect(container.querySelector('a[href="/cameras"]')).toBeTruthy();
    await act(async () => root.render(React.createElement(Dashboard, { ...props, sections: [{ type: 'webcams', isPublished: true, content: { webcams: [{}] } }] })));
    expect(container.querySelector('a[href="#location-cameras"]')).toBeTruthy();
    await act(async () => root.render(React.createElement(Dashboard, { ...props, loading: true, sections: [{ type: 'webcams', isPublished: true, content: { webcams: [{}] } }] })));
    expect(container.querySelector('a[href="#location-cameras"]')).toBeNull();
    expect(container.querySelector('a[href="/cameras"]')).toBeTruthy();
  });
  test('shows a recoverable error instead of a false empty state', async () => {
    calendarAPI.list.mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce({ success: true, data: [] });
    await act(async () => root.render(React.createElement(Dashboard, props)));
    expect(container.textContent).toContain('Το ημερολόγιο δεν είναι διαθέσιμο');
    expect(container.querySelector('a[href="/events/new?locationId=3"]')).toBeNull();
    await act(async () => container.querySelector('button').click());
    expect(container.querySelector('a[href="/events/new?locationId=3"]')).toBeTruthy();
  });
  test('ignores late calendar responses from a previous location', async () => {
    let finishOld;
    calendarAPI.list.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; })).mockResolvedValueOnce({ success: true, data: [] });
    await act(async () => root.render(React.createElement(Dashboard, props)));
    await act(async () => root.render(React.createElement(Dashboard, { location: { id: 4, slug: 'other' } })));
    await act(async () => finishOld({ success: true, data: [{ id: 'old', title: 'Wrong town', href: '/events/8', start: '2026-10-25' }] }));
    expect(container.textContent).not.toContain('Wrong town');
    expect(container.querySelector('a[href="/events/new?locationId=4"]')).toBeTruthy();
  });
});
