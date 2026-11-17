/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('@/lib/api/polls', () => ({ pollAPI: { uploadAttachment: jest.fn(), removeStagedAttachment: jest.fn(async () => ({ success: true })) } }));
const { pollAPI } = require('@/lib/api/polls');
const Editor = require('../components/polls/PollAttachmentEditor').default;
const Gallery = require('../components/polls/PollAttachments').default;
let container;
let root;
let latest;
const item = (id, mimeType = 'application/pdf') => ({ id, mimeType, title: `${id}.pdf`, caption: '', originalName: `${id}.pdf`, size: 1024, url: `/api/polls/attachments/${id}/file`, thumbnailUrl: mimeType.startsWith('image/') ? `/api/polls/attachments/${id}/file?thumbnail=true` : null });

function Harness({ initial = [], savedIds = [], onBusyChange }) {
  const [value, setValue] = React.useState(initial);
  latest = value;
  return React.createElement(Editor, { value, savedIds, onBusyChange, onChange: setValue });
}
async function selectFiles(files) {
  const input = container.querySelector('input[type=file]');
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
}
beforeEach(() => {
  jest.clearAllMocks();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

test('uploads several files, edits captions, reorders and removes an unsaved attachment', async () => {
  pollAPI.uploadAttachment.mockResolvedValueOnce({ attachment: item('photo', 'image/webp') }).mockResolvedValueOnce({ attachment: item('plan') });
  const onBusyChange = jest.fn();
  await act(async () => root.render(React.createElement(Harness, { onBusyChange })));
  await selectFiles([new File(['photo'], 'park.png', { type: 'image/png' }), new File(['pdf'], 'plan.pdf', { type: 'application/pdf' })]);
  expect(latest.map(entry => entry.id)).toEqual(['photo', 'plan']);
  expect(onBusyChange.mock.calls).toEqual([[true], [false]]);
  expect(container.querySelector('img').getAttribute('src')).toContain('thumbnail=true');
  const caption = container.querySelectorAll('input[type=text]')[1];
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(caption, 'Proposed park');
    caption.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(latest[0].caption).toBe('Proposed park');
  await act(async () => container.querySelector('[aria-label="Μετακίνηση συνημμένου 1 κάτω"]').click());
  expect(latest.map(entry => entry.id)).toEqual(['plan', 'photo']);
  await act(async () => container.querySelector('[aria-label="Αφαίρεση συνημμένου 1"]').click());
  expect(pollAPI.removeStagedAttachment).toHaveBeenCalledWith('plan');
  expect(latest.map(entry => entry.id)).toEqual(['photo']);
});

test('retains successful uploads when one file fails and allows retry', async () => {
  pollAPI.uploadAttachment.mockResolvedValueOnce({ attachment: item('good') }).mockRejectedValueOnce(new Error('Upload failed'));
  await act(async () => root.render(React.createElement(Harness)));
  await selectFiles([new File(['pdf'], 'good.pdf', { type: 'application/pdf' }), new File(['pdf'], 'bad.pdf', { type: 'application/pdf' })]);
  expect(latest).toHaveLength(1);
  expect(container.querySelector('[role=alert]').textContent).toContain('bad.pdf: Upload failed');
  expect(container.querySelector('input[type=file]').disabled).toBe(false);
  pollAPI.uploadAttachment.mockResolvedValueOnce({ attachment: item('retry') });
  await selectFiles([new File(['pdf'], 'retry.pdf', { type: 'application/pdf' })]);
  expect(latest).toHaveLength(2);
  expect(container.querySelector('[role=alert]')).toBeNull();
});

test('blocks more than 10 files and disables editing while an upload is pending', async () => {
  let finish;
  pollAPI.uploadAttachment.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  await act(async () => root.render(React.createElement(Harness)));
  const file = new File(['pdf'], 'plan.pdf', { type: 'application/pdf' });
  await selectFiles(Array(11).fill(file));
  expect(pollAPI.uploadAttachment).not.toHaveBeenCalled();
  expect(container.querySelector('[role=alert]').textContent).toContain('10');
  await selectFiles([file]);
  expect(container.querySelector('input[type=file]').disabled).toBe(true);
  await act(async () => finish({ attachment: item('uploaded') }));
  expect(container.querySelector('input[type=file]').disabled).toBe(false);
});

test('defers removal of saved attachments until the poll is saved', async () => {
  await act(async () => root.render(React.createElement(Harness, { initial: [item('saved')], savedIds: ['saved'] })));
  await act(async () => container.querySelector('[aria-label="Αφαίρεση συνημμένου 1"]').click());
  expect(latest).toEqual([]);
  expect(pollAPI.removeStagedAttachment).not.toHaveBeenCalled();
});

test('opens an accessible photo dialog and renders PDF open/download links', async () => {
  // jsdom does not implement the native dialog methods.
  const showModal = jest.fn(function () { this.open = true; });
  const close = jest.fn(function () { this.open = false; this.dispatchEvent(new Event('close')); });
  HTMLDialogElement.prototype.showModal = showModal;
  HTMLDialogElement.prototype.close = close;
  await act(async () => root.render(React.createElement(Gallery, { attachments: [item('photo', 'image/webp'), item('plan')] })));
  await act(async () => container.querySelector('[aria-label="Μεγέθυνση: photo.pdf"]').click());
  expect(showModal).toHaveBeenCalled();
  expect(container.querySelector('dialog').getAttribute('aria-label')).toBe('photo.pdf');
  const pdfLink = container.querySelector('[aria-label="Άνοιγμα PDF: plan.pdf"]');
  expect(pdfLink.getAttribute('target')).toBe('_blank');
  expect(container.querySelectorAll('a[href$="download=true"]')).toHaveLength(2);
  expect(container.textContent).toContain('PDF · 1.0 KB');
  await act(async () => container.querySelector('dialog button').click());
  expect(close).toHaveBeenCalled();
  delete HTMLDialogElement.prototype.showModal;
  delete HTMLDialogElement.prototype.close;
});
