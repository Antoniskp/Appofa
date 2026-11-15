/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const { NEWSLETTER_TEMPLATES } = require('../lib/constants/newsletterTemplates');
const { buildFeaturedQuestionBlock } = require('../lib/constants/newsletterFollowups');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const mockGetQuestions = jest.fn();
jest.mock('@/lib/api', () => ({ civicQuestionAPI: { getAll: (...args) => mockGetQuestions(...args) } }));
const Campaigns = require('../components/admin/NewsletterUserCampaigns').default;
const Picker = require('../components/admin/NewsletterCivicQuestionPicker').default;
const publicQuestion = { id: 12, title: 'A new question <script>alert(1)</script>', sourceType: 'parliament', visibility: 'public', voteRestriction: 'authenticated', status: 'open' };
let root;
let container;
beforeEach(() => {
  mockGetQuestions.mockReset();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
const click = async (text) => act(async () => [...container.querySelectorAll('button')].find((button) => button.textContent === text).click());

test('dashboard offers four user campaigns with working Greek and English draft templates', async () => {
  await act(async () => root.render(React.createElement(Campaigns)));
  expect(container.querySelectorAll('article')).toHaveLength(4);
  expect(container.textContent).toContain('send it to your own inbox');
  expect(container.textContent).toContain('New parliament questions');
  const links = [...container.querySelectorAll('a')];
  expect(links).toHaveLength(8);
  links.forEach((link) => {
    const key = new URL(link.href).searchParams.get('template');
    const template = NEWSLETTER_TEMPLATES.find((item) => item.key === key);
    expect(template).toBeDefined();
    expect(template.audienceFilters.status).toBe('subscribed');
    expect(['registered', 'missing_location']).toContain(template.audienceFilters.segment);
  });
});

test('picker uses recent parliament questions and excludes private, local-only, closed and expired items', async () => {
  mockGetQuestions.mockResolvedValue({ success: true, data: [
    publicQuestion,
    { ...publicQuestion, id: 13, visibility: 'private' },
    { ...publicQuestion, id: 14, voteRestriction: 'locals_only' },
    { ...publicQuestion, id: 15, sourceType: 'other' },
    { ...publicQuestion, id: 16, status: 'closed' },
    { ...publicQuestion, id: 17, deadline: '2020-01-01' },
  ] });
  const insert = jest.fn();
  await act(async () => root.render(React.createElement(Picker, { onInsert: insert, locale: 'en' })));
  await click('Find questions');
  expect(mockGetQuestions).toHaveBeenCalledWith(expect.objectContaining({ sourceType: 'parliament', status: 'open', sortBy: 'newest' }));
  expect(container.querySelectorAll('option')).toHaveLength(1);
  await click('Insert question card');
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({
    html: expect.stringContaining('{{siteUrl}}/civic-questions/12'),
    text: expect.stringContaining('advisory'),
  }));
  expect(insert.mock.calls[0][0].html).toContain('&lt;script&gt;');
  expect(insert.mock.calls[0][0].html).not.toContain('<script>');
});

test('question cards validate access again when inserted and include a real detail link in both versions', () => {
  expect(() => buildFeaturedQuestionBlock({ ...publicQuestion, visibility: 'private' })).toThrow();
  expect(() => buildFeaturedQuestionBlock({ ...publicQuestion, deadline: '2020-01-01' })).toThrow();
  const block = buildFeaturedQuestionBlock(publicQuestion, 'el');
  expect(block.html).toContain('{{siteUrl}}/civic-questions/12');
  expect(block.text).toContain('{{siteUrl}}/civic-questions/12');
  expect(block.text).toContain('συμβουλευτική');
  for (const locale of ['el', 'en']) {
    const template = NEWSLETTER_TEMPLATES.find((item) => item.key === `parliament_followup_${locale}`);
    expect(template.htmlContent).toContain('{{siteUrl}}/civic-questions');
    expect(template.textContent).toContain('{{siteUrl}}/civic-questions');
    expect(template.audienceFilters).toMatchObject({ segment: 'registered', topic: 'general', locale });
  }
});

test('a failed question lookup shows an error and can be retried without inserting content', async () => {
  mockGetQuestions.mockRejectedValueOnce(new Error('Please retry')).mockResolvedValueOnce({ success: true, data: [] });
  const insert = jest.fn();
  await act(async () => root.render(React.createElement(Picker, { onInsert: insert })));
  await click('Find questions');
  expect(container.querySelector('[role="alert"]').textContent).toBe('Please retry');
  await click('Find questions');
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.textContent).toContain('No open public parliament questions match');
  expect(insert).not.toHaveBeenCalled();
});
