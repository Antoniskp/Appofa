/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const OrgAvatar = require('../components/organization/OrgAvatar').default;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('organization logos', () => {
  let container, root;
  beforeEach(() => {
    container = document.createElement('div');
    root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); });
  const render = async org => {
    await act(async () => root.render(React.createElement(OrgAvatar, { org })));
    return container.querySelector('img');
  };

  test('uses the admin-saved logo even for a recognized party', async () => {
    const img = await render({ type: 'party', name: 'ΚΚΕ', logo: '/custom-party.png' });
    expect(img.getAttribute('src')).toBe('/custom-party.png');
    expect(img.className).toContain('object-contain');
  });

  test('does not assign a logo by party name when the saved logo is empty', async () => {
    const img = await render({ type: 'party', name: 'Νέα αριστερά', logo: null });
    expect(img).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  test('preserves other organization logos and recovers when a failed URL changes', async () => {
    const org = { type: 'company', name: 'ΚΚΕ', logo: '/custom.png' };
    const img = await render(org);
    expect(img.getAttribute('src')).toBe('/custom.png');
    await act(async () => img.dispatchEvent(new Event('error')));
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
    expect((await render({ ...org, logo: '/replacement.png' })).getAttribute('src')).toBe('/replacement.png');
  });
});
