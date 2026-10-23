import { slugify } from './slugify';

const headingText = (node) => {
  if (node.type === 'text') return node.value;
  if (node.tagName === 'img') return node.properties?.alt || '';
  return (node.children || []).map(headingText).join('');
};

// Work on the parsed Markdown tree so code examples cannot become index entries.
export default function articleContents() {
  return (tree) => {
    const headings = [];
    const usedIds = new Set();
    const visit = (node) => {
      if (/^h[1-6]$/.test(node.tagName || '')) {
        const title = headingText(node).trim();
        if (title) {
          const base = `article-section-${slugify(title) || 'heading'}`;
          let id = base;
          let suffix = 2;
          while (usedIds.has(id)) id = `${base}-${suffix++}`;
          usedIds.add(id);
          node.properties = { ...node.properties, id };
          headings.push({ id, title, level: Number(node.tagName[1]), children: [] });
        }
      }
      (node.children || []).forEach(visit);
    };
    visit(tree);
    if (headings.length < 2) return;

    const outline = [];
    const parents = [];
    for (const heading of headings) {
      while (parents.length && parents[parents.length - 1].level >= heading.level) parents.pop();
      (parents.length ? parents[parents.length - 1].children : outline).push(heading);
      parents.push(heading);
    }
    tree.children = [{
      type: 'element', tagName: 'div',
      properties: { className: ['grid', 'gap-8', 'xl:grid-cols-[15rem_minmax(0,1fr)]', 'items-start', 'print:block'] },
      children: [
        { type: 'element', tagName: 'article-toc', properties: {}, data: { outline }, children: [] },
        { type: 'element', tagName: 'div', properties: { className: ['min-w-0', 'space-y-3'] }, children: tree.children },
      ],
    }];
  };
}
