const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
jest.mock('next-intl', () => ({ useTranslations: () => () => 'Περιεχόμενα' }));
const ArticleContents = require('../components/articles/ArticleContents').default;
const articleContents = require('../lib/utils/articleContents').default;
const text = value => ({ type: 'text', value });
const element = (tagName, children) => ({ type: 'element', tagName, properties: {}, children });
const heading = (label, level = 2) => element(`h${level}`, [text(label)]);
const transform = children => {
  const tree = { type: 'root', children };
  articleContents()(tree);
  return tree;
};
const outlineOf = tree => tree.children[0].children[0].data.outline;
describe('Article section navigation', () => {
  test('indexes Greek formatted headings and nests subsections with matching destinations', () => {
    const first = element('h2', [text('Το '), element('strong', [text('κράτος')])]);
    const child = heading('Η οικονομία', 4);
    const outline = outlineOf(transform([first, child, heading('Τέλος')]));
    expect(outline).toHaveLength(2);
    expect(outline[0].title).toBe('Το κράτος');
    expect(outline[0].children[0].title).toBe('Η οικονομία');
    expect(first.properties.id).toBe(outline[0].id);
    expect(child.properties.id).toBe(outline[0].children[0].id);
    const html = renderToStaticMarkup(React.createElement(ArticleContents, { headings: outline }));
    expect(html).toContain('aria-label="Περιεχόμενα"');
    expect(html).toContain('href="#article-section-το-κράτος"');
    expect(html).toMatch(/Η οικονομία<\/a><\/li><\/ol><\/li>/);
    expect(html).not.toContain('target="_blank"');
    expect(html).toContain('<details open="">');
  });
  test('assigns unique IDs to repeated, colliding and punctuation-only headings', () => {
    const nodes = ['Test', 'Test', 'Test-2', '!!!', '???'].map(label => heading(label));
    transform(nodes);
    expect(new Set(nodes.map(node => node.properties.id)).size).toBe(5);
    expect(nodes[2].properties.id).toBe('article-section-test-2-2');
  });
  test('ignores heading-like code and includes image alt text', () => {
    const image = element('img', []);
    image.properties.alt = 'Διάγραμμα';
    const tree = transform([heading('First'), element('pre', [element('code', [text('## Fake')])]), element('h2', [image])]);
    expect(outlineOf(tree).map(item => item.title)).toEqual(['First', 'Διάγραμμα']);
  });
  test('omits the index with fewer than two nonempty headings', () => {
    for (const children of [[], [element('p', [text('Short news')])], [heading('Only'), heading('')]]) {
      expect(transform(children).children).toBe(children);
    }
  });
  test('keeps IDs deterministic across renders', () => {
    const build = () => transform([heading('Ελλάδα'), heading('Ελλάδα')]);
    expect(build()).toEqual(build());
  });
});
