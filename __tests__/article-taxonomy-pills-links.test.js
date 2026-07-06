const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

jest.mock('next/link', () => {
  return function MockLink({ href, children, className }) {
    return React.createElement('a', { href, className }, children);
  };
});

const ArticleTaxonomyPills = require('../components/articles/ArticleTaxonomyPills').default;
const {
  buildTaxonomyHref,
  getArticleTypeHref,
} = require('../lib/utils/taxonomyLinks');

describe('Article taxonomy pill links', () => {
  test('renders type, category, and tag pills as anchors with expected hrefs', () => {
    const html = renderToStaticMarkup(
      React.createElement(ArticleTaxonomyPills, {
        article: {
          type: 'news',
          category: 'Πολιτική',
          tags: ['Ελλάδα', 'Εκλογές'],
        },
        size: 'md',
      }),
    );

    expect(html).toContain('href="/news"');
    expect(html).toContain('href="/news?category=%CE%A0%CE%BF%CE%BB%CE%B9%CF%84%CE%B9%CE%BA%CE%AE"');
    expect(html).toContain('href="/topics/%CE%B5%CE%BB%CE%BB%CE%AC%CE%B4%CE%B1"');
    expect(html).toContain('href="/topics/%CE%B5%CE%BA%CE%BB%CE%BF%CE%B3%CE%AD%CF%82"');
    expect(html).toContain('Νέα');
    expect(html).toContain('Πολιτική');
    expect(html).toContain('Ελλάδα');
    expect(html).toContain('Εκλογές');
  });

  test('builds personal article type links to filtered articles page', () => {
    expect(getArticleTypeHref('personal')).toBe('/articles?type=personal');
    expect(buildTaxonomyHref('/polls', 'category', 'Economy')).toBe('/polls?category=Economy');
    expect(buildTaxonomyHref('/polls', 'tag', 'Tax reform')).toBe('/topics/tax-reform');
  });
});
