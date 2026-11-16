const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { useAsyncData } = require('../hooks/useAsyncData');
const ContactPeople = require('../components/ContactPeople').default;
const translations = require('../messages/en.json').static_pages;

jest.mock('../hooks/useAsyncData', () => ({ useAsyncData: jest.fn() }));
jest.mock('next-intl', () => ({
  useTranslations: () => key => require('../messages/en.json').static_pages[key],
}));

function render(state) {
  useAsyncData.mockReturnValue({ loading: false, data: null, error: null, refetch: jest.fn(), ...state });
  return renderToStaticMarkup(React.createElement(ContactPeople));
}

test('links to confirmed profiles with separate admin and early contributor recognition', () => {
  const html = render({ data: {
    admins: [{ id: 1, username: 'current-admin' }],
    earlyMembers: [{ id: 2, username: 'Simeon' }, { id: 3, username: 'mariosliviri' }, { id: 4, username: 'Panos' }],
  } });
  expect(html).toContain('href="/users/Simeon"');
  expect(html).toContain('href="/users/mariosliviri"');
  expect(html).toContain('href="/users/Panos"');
  expect(html).toContain(translations.contact_admin_label);
  expect(html).toContain(translations.contact_early_contributor_label);
  expect(html).toContain(translations.contact_early_member_label);
});

test('handles loading, unavailable profiles, and an empty admin list', () => {
  expect(render({ loading: true })).toContain(translations.contact_people_loading);
  const failed = render({ error: 'Network error' });
  expect(failed).toContain(translations.contact_people_error);
  expect(failed).toContain(translations.contact_people_retry);
  const empty = render({ data: { admins: [], earlyMembers: [] } });
  expect(empty).toContain(translations.contact_admins_empty);
  expect(empty).not.toContain(translations.contact_early_members_title);
});
