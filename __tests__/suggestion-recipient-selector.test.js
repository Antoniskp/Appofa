/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('next-intl', () => ({ useTranslations: () => key => key, useLocale: () => 'en' }));
jest.mock('@/lib/api/suggestions', () => ({ suggestionAPI: { getRecipients: jest.fn() } }));
const { suggestionAPI } = require('../lib/api/suggestions');
const Selector = require('../components/suggestions/RecipientSelector').default;

describe('Office selection', () => {
  let container, root;
  const offices = [{ key: 'mayor:7', kind: 'mayor', locationName: 'Town', locationId: 7 }];
  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    suggestionAPI.getRecipients.mockResolvedValue({ success: true, data: offices });
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  test('requires a location, loads offices, and returns a stable office key', async () => {
    const onChange = jest.fn();
    await act(async () => root.render(<Selector locationId={null} value={null} onChange={onChange} />));
    expect(container.querySelector('select').disabled).toBe(true);
    expect(suggestionAPI.getRecipients).not.toHaveBeenCalled();
    await act(async () => root.render(<Selector locationId={7} value={null} onChange={onChange} />));
    const select = container.querySelector('select');
    expect(select.disabled).toBe(false);
    expect(select.textContent).toContain('mayor · Town');
    await act(async () => { select.value = 'mayor:7'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(onChange).toHaveBeenCalledWith('mayor:7');
  });
  test('ignores stale office responses after a location change', async () => {
    let resolveOld;
    suggestionAPI.getRecipients.mockImplementation(id => id === 7 ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve({ success: true, data: [{ ...offices[0], key: 'mayor:8', locationName: 'New town' }] }));
    await act(async () => root.render(<Selector locationId={7} onChange={() => {}} />));
    await act(async () => root.render(<Selector locationId={8} onChange={() => {}} />));
    await act(async () => resolveOld({ success: true, data: offices }));
    expect(container.querySelector('select').textContent).toContain('New town');
    expect(container.querySelector('option[value="mayor:7"]')).toBeNull();
  });
  test('shows an error and offers a working retry', async () => {
    suggestionAPI.getRecipients.mockRejectedValueOnce(new Error('offline'));
    await act(async () => root.render(<Selector locationId={7} onChange={() => {}} />));
    expect(container.querySelector('[role="alert"]').textContent).toContain('load_error');
    expect(container.querySelector('select').disabled).toBe(true);
    await act(async () => container.querySelector('button').click());
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector('select').disabled).toBe(false);
  });
  test('preserves a historical office and lets the user clear it', async () => {
    const onChange = jest.fn();
    const recipient = { key: 'position:2', kind: 'position', title: 'Υπουργός', titleEn: 'Minister', locationName: 'Greece' };
    await act(async () => root.render(<Selector locationId={7} value="position:2" currentRecipient={recipient} onChange={onChange} />));
    expect(container.querySelector('select').value).toBe('position:2');
    expect(container.textContent).toContain('Minister · Greece');
    await act(async () => container.querySelector('button').click());
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
