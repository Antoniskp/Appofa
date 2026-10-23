// Narrow warning for accidental authoring instructions, not a content classifier.
export function hasAuthoringPrompt(text) {
  return typeof text === 'string' && /^\s*(?:make|write|generate|create)\s+(?:me\s+)?(?:an?\s+)?(?:article|blog\s+post|essay)\b/i.test(text);
}

export function editorialPreview(article) {
  const summary = article.summary?.trim();
  if (summary && !hasAuthoringPrompt(summary)) return summary;
  const content = article.content?.trim();
  return content && !hasAuthoringPrompt(content) ? content.slice(0, 200) : '';
}
