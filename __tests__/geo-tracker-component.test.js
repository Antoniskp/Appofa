/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let mockPathname = '/news';
const mockTrackVisit = jest.fn().mockResolvedValue({ success: true });
const mockDetect = jest.fn(() => new Promise(() => {}));

jest.mock('next/navigation', () => ({ usePathname: () => mockPathname }));
jest.mock('@/lib/api/geoAdmin', () => ({
  geoAdminAPI: { trackVisit: (...args) => mockTrackVisit(...args) },
}));
jest.mock('@/lib/api/geo', () => ({
  geoAPI: { detect: (...args) => mockDetect(...args) },
}));

const GeoTracker = require('../components/layout/GeoTracker').default;

test('records route changes without waiting for a country lookup', async () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  document.cookie = 'NEXT_LOCALE=el';
  try {
    await act(async () => { root.render(React.createElement(GeoTracker)); });
    expect(mockTrackVisit).toHaveBeenCalledWith({ path: '/news', locale: 'el' });
    expect(mockDetect).not.toHaveBeenCalled();

    mockPathname = '/polls';
    await act(async () => { root.render(React.createElement(GeoTracker)); });
    expect(mockTrackVisit).toHaveBeenLastCalledWith({ path: '/polls', locale: 'el' });
    expect(mockTrackVisit).toHaveBeenCalledTimes(2);
  } finally {
    await act(async () => { root.unmount(); });
    document.cookie = 'NEXT_LOCALE=; max-age=0';
  }
});
