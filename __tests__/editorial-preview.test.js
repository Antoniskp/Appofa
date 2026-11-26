const { editorialPreview, hasAuthoringPrompt } = require('../lib/utils/editorialPreview');
test('accidental authoring instruction is replaced by actual content', () => {
  expect(editorialPreview({ summary: 'make me an article in markdown in greek', content: 'Η δημόσια συμμετοχή ξεκινά εδώ.' })).toBe('Η δημόσια συμμετοχή ξεκινά εδώ.');
});
test('normal summaries and quoted discussion remain intact', () => {
  expect(editorialPreview({ summary: 'Δημόσια συζήτηση', content: 'Body' })).toBe('Δημόσια συζήτηση');
  expect(hasAuthoringPrompt('The phrase “write me an article” appears in the research.')).toBe(false);
});
test('does not replace one instruction with another', () => {
  expect(editorialPreview({ summary: 'write an article about x', content: 'generate me an article about y' })).toBe('');
});
const { toPlainText, metaDescription } = require('../lib/utils/editorialPreview');
test('previews strip markdown so cards do not show raw syntax', () => {
  const content = '# ⚡ Η Ώρα της Αλήθειας\n\nΈνας **οδηγός** για τον [πολίτη](https://x.gr)\n\n---\n\n> «Η δημοκρατία δεν είναι θέαμα»\n\n- πρώτο\n- δεύτερο';
  expect(toPlainText(content)).toBe('⚡ Η Ώρα της Αλήθειας Ένας οδηγός για τον πολίτη «Η δημοκρατία δεν είναι θέαμα» πρώτο δεύτερο');
  expect(toPlainText('Ένας οδηγός --- «Η δημοκρατία»')).toBe('Ένας οδηγός «Η δημοκρατία»');
  expect(editorialPreview({ content: 'λέξη '.repeat(80) }).endsWith('…')).toBe(true);
});
test('meta descriptions prefer the summary and stay within length', () => {
  expect(metaDescription({ summary: 'Σύντομη **περίληψη**', content: 'x' })).toBe('Σύντομη περίληψη');
  expect(metaDescription({ content: 'α '.repeat(200) }).length).toBeLessThanOrEqual(161);
});
