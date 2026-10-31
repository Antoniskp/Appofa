/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) }));
const OrganizationPeople = require('../components/organization/OrganizationPeople').default;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('shows current people with large photos, profile links and image fallback', async () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  const person = { slug: 'example-person', firstNameNative: 'Example', lastNameNative: 'Person', photo: '/portrait.webp', avatar: '/avatar.png' };
  const current = { id: 1, title: 'Chair', isCurrent: true, personProfile: person };
  await act(async () => root.render(React.createElement(OrganizationPeople, { title: 'Roles', roles: [current, { ...current, id: 2, isCurrent: false }, { id: 3, isCurrent: true }] })));
  expect(container.querySelectorAll('a')).toHaveLength(1);
  expect(container.querySelector('a').getAttribute('href')).toBe('/persons/example-person');
  expect(container.textContent).toContain('Example Person');
  expect(container.textContent).toContain('Chair');
  const img = container.querySelector('img');
  expect(img.getAttribute('src')).toBe('/portrait.webp');
  expect(img.className).toContain('sm:h-24');
  await act(async () => img.dispatchEvent(new Event('error')));
  expect(container.querySelector('img').getAttribute('src')).toBe('/avatar.png');
  await act(async () => container.querySelector('img').dispatchEvent(new Event('error')));
  expect(container.querySelector('img')).toBeNull();
  expect(container.querySelector('svg')).not.toBeNull();
  await act(async () => root.unmount());
});
