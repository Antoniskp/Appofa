/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const RolePersonPhoto = require('../components/organization/RolePersonPhoto').default;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('shows large profile photos with avatar and icon fallbacks', async () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  const person = { slug: 'example-person', firstNameNative: 'Example', lastNameNative: 'Person', photo: '/portrait.webp', avatar: '/avatar.png' };
  await act(async () => root.render(React.createElement(RolePersonPhoto, { person, name: 'Example Person' })));
  const img = container.querySelector('img');
  expect(img.getAttribute('src')).toBe('/portrait.webp');
  expect(img.getAttribute('alt')).toBe('Example Person');
  expect(img.className).toContain('sm:h-24');
  await act(async () => img.dispatchEvent(new Event('error')));
  expect(container.querySelector('img').getAttribute('src')).toBe('/avatar.png');
  await act(async () => container.querySelector('img').dispatchEvent(new Event('error')));
  expect(container.querySelector('img')).toBeNull();
  expect(container.querySelector('svg')).not.toBeNull();
  await act(async () => root.unmount());
});
