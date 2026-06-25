const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

jest.mock('next/link', () => {
  return function MockLink({ href, children, className }) {
    return React.createElement('a', { href, className }, children);
  };
});

const PlatformPage = require('../app/(statics)/platform/page').default;

describe('/platform links', () => {
  test('includes the technology stack page link', () => {
    const html = renderToStaticMarkup(React.createElement(PlatformPage));

    expect(html).toContain('href="/platform/technology"');
    expect(html).toContain('Τεχνολογίες');
  });
});
