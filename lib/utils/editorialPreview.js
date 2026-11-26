// Narrow warning for accidental authoring instructions, not a content classifier.
export function hasAuthoringPrompt(text) {
  return typeof text === 'string' && /^\s*(?:make|write|generate|create)\s+(?:me\s+)?(?:an?\s+)?(?:article|blog\s+post|essay)\b/i.test(text);
}

// Turn markdown/HTML article text into plain text suitable for cards and meta descriptions.
export function toPlainText(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/gm, ' ')
    .replace(/(^|\s)-{3,}(?=\s|$)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, '')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(^|[\s(])[*_]([^*_\n]+)[*_](?=[\s).,;:!?]|$)/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Cut at a word boundary and add an ellipsis when shortened.
export function truncateText(text, max) {
  if (!text || text.length <= max) return text || '';
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–—-]+$/, '')}…`;
}

export function editorialPreview(article, max = 200) {
  const summary = toPlainText(article.summary);
  if (summary && !hasAuthoringPrompt(summary)) return summary;
  const content = toPlainText(article.content);
  return content && !hasAuthoringPrompt(content) ? truncateText(content, max) : '';
}

// Plain-text description for <meta name="description"> and Open Graph.
export function metaDescription(article, max = 160) {
  return truncateText(toPlainText(article?.summary) || toPlainText(article?.content), max);
}
