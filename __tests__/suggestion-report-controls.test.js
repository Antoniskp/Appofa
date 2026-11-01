/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('next/link', () => ({ children, ...props }) => React.createElement('a', props, children));
jest.mock('@/lib/api', () => ({ mediaAPI: { upload: jest.fn() }, suggestionAPI: { getNearby: jest.fn() } }));
const { mediaAPI, suggestionAPI } = require('@/lib/api');
const Photos = require('../components/suggestions/SuggestionPhotos').default;
const Nearby = require('../components/suggestions/NearbySuggestions').default;
let container, root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); jest.clearAllMocks(); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); jest.useRealTimers(); });

test('upload exposes busy state, saves the server asset and supports repair classification', async () => {
  const onChange = jest.fn();
  const onBusyChange = jest.fn();
  mediaAPI.upload.mockResolvedValue({ success: true, media: { id: 3, url: '/uploads/photo.webp' } });
  await act(async () => root.render(React.createElement(Photos, { photos: [], onChange, onBusyChange })));
  const file = new File(['photo'], 'photo.png', { type: 'image/png' });
  const input = container.querySelector('input[type="file"]');
  Object.defineProperty(input, 'files', { value: [file] });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
  expect(onBusyChange.mock.calls).toEqual([[true], [false]]);
  expect(onChange).toHaveBeenCalledWith([{ id: 3, url: '/uploads/photo.webp', kind: 'report', caption: '' }]);
  await act(async () => root.render(React.createElement(Photos, { photos: onChange.mock.calls[0][0], onChange })));
  const select = container.querySelector('select');
  await act(async () => { select.value = 'repair'; select.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(onChange.mock.calls.at(-1)[0][0].kind).toBe('repair');
});

test('upload failure keeps current photos and allows retry', async () => {
  const onChange = jest.fn();
  mediaAPI.upload.mockRejectedValue(new Error('Upload failed'));
  await act(async () => root.render(React.createElement(Photos, { photos: [], onChange })));
  const input = container.querySelector('input[type="file"]');
  Object.defineProperty(input, 'files', { value: [new File(['x'], 'x.png')] });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
  expect(onChange).not.toHaveBeenCalled();
  expect(container.querySelector('[role="alert"]').textContent).toBe('Upload failed');
  expect(input.disabled).toBe(false);
});

test('nearby lookup ignores stale responses after moving the pin', async () => {
  jest.useFakeTimers();
  let resolveFirst;
  suggestionAPI.getNearby.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }))
    .mockResolvedValueOnce({ success: true, data: [{ id: 4, title: 'Current nearby report', distance: 8 }] });
  await act(async () => root.render(React.createElement(Nearby, { lat: 38, lng: 23 })));
  await act(async () => jest.advanceTimersByTime(350));
  await act(async () => root.render(React.createElement(Nearby, { lat: 39, lng: 24 })));
  await act(async () => jest.advanceTimersByTime(350));
  await act(async () => resolveFirst({ success: true, data: [{ id: 1, title: 'Stale report', distance: 0 }] }));
  expect(container.textContent).toContain('Current nearby report');
  expect(container.textContent).not.toContain('Stale report');
  expect(container.querySelector('a').getAttribute('href')).toBe('/suggestions/4');
});
