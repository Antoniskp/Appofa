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
