/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockApi = {
  adminGetCampaign: jest.fn(), adminCampaignLogs: jest.fn(), adminSendCampaignTest: jest.fn(),
  adminSendCampaignNow: jest.fn(), adminScheduleCampaign: jest.fn(), adminUpdateCampaign: jest.fn(),
};
jest.mock('@/lib/api', () => ({ newsletterAPI: mockApi }));
jest.mock('next/navigation', () => ({ useParams: () => ({ id: '1' }) }));
jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { email: 'admin@test.com' } }) }));
jest.mock('@/components/ToastProvider', () => ({ useToast: () => ({ addToast: jest.fn() }) }));
jest.mock('@/components/ProtectedRoute', () => ({ __esModule: true, default: ({ children }) => children }));
jest.mock('@/components/admin/AdminLayout', () => ({ __esModule: true, default: ({ children }) => children }));
jest.mock('@/components/admin/NewsletterAudienceFields', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/admin/NewsletterPollPicker', () => ({ __esModule: true, default: () => null }));
const Page = require('../app/admin/newsletter/campaigns/[id]/page').default;

let root;
let container;
let saved;
beforeEach(() => {
  jest.clearAllMocks();
  saved = {
    campaign: { id: 1, subject: 'Complete your profile', htmlContent: '<p>Hello</p>', status: 'draft', audienceFilters: {} },
    estimatedRecipients: 12, sampleRecipients: ['member@test.com'], previewHtml: '<p>Hello</p>', testReview: { current: false },
  };
  mockApi.adminGetCampaign.mockImplementation(async () => ({ success: true, data: saved }));
  mockApi.adminCampaignLogs.mockResolvedValue({ success: true, data: { logs: [] } });
  mockApi.adminSendCampaignNow.mockResolvedValue({ success: true });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
const button = (text) => [...container.querySelectorAll('button')].find((element) => element.textContent.includes(text));

test('test goes to the admin inbox; delivery requires checking the received message', async () => {
  mockApi.adminSendCampaignTest.mockImplementation(async () => {
    saved = { ...saved, campaign: { ...saved.campaign, lastTestContentHash: 'reviewed', lastTestSentAt: '2026-11-15T10:00:00Z' }, testReview: { current: true, email: 'admin@test.com', sentAt: '2026-11-15T10:00:00Z' } };
    return { success: true };
  });
  await act(async () => root.render(React.createElement(Page)));
  expect(container.querySelector('#campaign-test-email').value).toBe('admin@test.com');
  const delivery = container.querySelector('[aria-labelledby="campaign-delivery-heading"]');
  expect(delivery.contains(button('Send now'))).toBe(true);
  expect(delivery.compareDocumentPosition(container.querySelector('form'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(delivery.textContent).toContain('12 estimated recipients');
  expect(delivery.textContent).toContain('Send a test email and confirm your review');
  expect(button('Send now').disabled).toBe(true);
  await act(async () => button('Send test email').click());
  expect(mockApi.adminSendCampaignTest).toHaveBeenCalledWith('1', { email: 'admin@test.com' });
  expect(mockApi.adminSendCampaignNow).not.toHaveBeenCalled();
  expect(container.querySelector('#campaign-send-help').textContent).toContain('Confirm your review');
  expect(button('Send now').disabled).toBe(true);
  await act(async () => container.querySelector('input[type="checkbox"]').click());
  expect(button('Send now').disabled).toBe(false);
  await act(async () => button('Send now').click());
  expect(mockApi.adminSendCampaignNow).toHaveBeenCalledWith('1');
  expect(mockApi.adminScheduleCampaign).not.toHaveBeenCalled();
});

test('editing reviewed content disables test, schedule and delivery until saved and retested', async () => {
  saved.testReview.current = true;
  saved.campaign.lastTestContentHash = 'reviewed';
  await act(async () => root.render(React.createElement(Page)));
  await act(async () => container.querySelector('input[type="checkbox"]').click());
  expect(button('Send now').disabled).toBe(false);
  const subject = container.querySelector('input[type="text"]');
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(subject, 'A better subject');
    subject.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(button('Send test email').disabled).toBe(true);
  expect(button('Send now').disabled).toBe(true);
  expect(container.querySelector('#campaign-send-help').textContent).toBe('Save your changes before sending.');
  expect(button('Schedule reviewed').disabled).toBe(true);
  expect(container.querySelector('input[type="checkbox"]').checked).toBe(false);
});

test('a reviewed campaign can be scheduled explicitly or its schedule cancelled', async () => {
  saved.testReview.current = true;
  saved.campaign.lastTestContentHash = 'reviewed';
  saved.campaign.status = 'scheduled';
  saved.campaign.scheduledAt = '2027-01-01T10:30:00Z';
  mockApi.adminScheduleCampaign.mockResolvedValue({ success: true });
  mockApi.adminUpdateCampaign.mockResolvedValue({ success: true });
  await act(async () => root.render(React.createElement(Page)));
  await act(async () => container.querySelector('input[type="checkbox"]').click());
  const date = container.querySelector('input[type="datetime-local"]');
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(date, '2027-01-02T12:30');
    date.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(button('Schedule reviewed').disabled).toBe(false);
  await act(async () => button('Schedule reviewed').click());
  expect(mockApi.adminScheduleCampaign).toHaveBeenCalledWith('1', { scheduledAt: new Date('2027-01-02T12:30').toISOString() });
  await act(async () => button('Cancel scheduled delivery').click());
  expect(mockApi.adminUpdateCampaign).toHaveBeenCalledWith('1', { scheduledAt: null });
});

test('saving an individual draft retains its selected user and displays that recipient', async () => {
  saved.campaign.audienceFilters = { recipientMode: 'individual', recipientUserId: 42 };
  saved.individualRecipient = { id: 42, username: 'member', email: 'member@test.com' };
  saved.estimatedRecipients = 1;
  mockApi.adminUpdateCampaign.mockResolvedValue({ success: true });
  await act(async () => root.render(React.createElement(Page)));
  expect(container.textContent).toContain('member · member@test.com');
  expect(container.querySelector('#campaign-send-audience').textContent).toContain('member@test.com');
  expect(button('Send now').disabled).toBe(true);
  await act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(mockApi.adminUpdateCampaign).toHaveBeenCalledWith('1', expect.objectContaining({ audienceFilters: expect.objectContaining({ recipientMode: 'individual', recipientUserId: 42 }) }));
});

test('explains why immediate delivery is disabled for an empty audience', async () => {
  saved.estimatedRecipients = 0;
  saved.testReview.current = true;
  await act(async () => root.render(React.createElement(Page)));
  await act(async () => container.querySelector('input[type="checkbox"]').click());
  expect(button('Send now').disabled).toBe(true);
  expect(container.querySelector('#campaign-send-help').textContent).toBe('No eligible recipients match the saved audience.');
});

test.each([
  ['sending', 'Campaign delivery is in progress.'],
  ['sent', 'This campaign has already been sent.'],
])('shows the delivery status for a %s campaign', async (status, message) => {
  saved.campaign.status = status;
  await act(async () => root.render(React.createElement(Page)));
  expect(button('Send now')).toBeUndefined();
  expect(container.querySelector('[aria-labelledby="campaign-delivery-heading"] [role="status"]').textContent).toBe(message);
});
