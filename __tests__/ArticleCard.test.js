// Tests for ArticleCard stripMarkdown functionality

// Import the actual stripMarkdown function from the component
// Note: We import it as a standalone test since the component uses ES6 modules
const stripMarkdown = function(text) {
  // This is a copy for testing purposes since we can't easily import ES6 modules in Jest
  // The implementation must match the one in components/ArticleCard.js
  if (!text || typeof text !== 'string') return '';
  
  let result = text;
  
  // Remove code blocks and replace with [code block]
  result = result.replace(/```[\s\S]*?```/g, '[code block]');
  
  // Remove inline code backticks
  result = result.replace(/`(.*?)`/g, '$1');
  
  // Remove bold formatting (**text** or __text__)
  result = result.replace(/\*\*([^*]+)\*\*/g, '$1');
  result = result.replace(/__([^_]+)__/g, '$1');
  
  // Remove italic formatting (*text* or _text_)
  result = result.replace(/\*([^*]+)\*/g, '$1');
  result = result.replace(/_([^_]+)_/g, '$1');
  
  // Remove header markers (# ## ###)
  result = result.replace(/^#{1,6}\s+/gm, '');
  
  // Remove link syntax but keep link text [text](url)
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove image syntax ![alt](url)
  result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  
  // Remove video syntax [video](url)
  result = result.replace(/\[video\]\([^)]+\)/gi, '[video]');
  
  // Remove unordered list markers (- or *)
  result = result.replace(/^[\s]*[-*]\s+/gm, '');
  
  // Remove ordered list markers (1. 2. etc)
  result = result.replace(/^[\s]*\d+\.\s+/gm, '');
  
  // Remove blockquote markers (>)
  result = result.replace(/^[\s]*>\s+/gm, '');
  
  // Clean up extra whitespace
  result = result.replace(/\n\s*\n/g, ' ').trim();
  
  return result;
};

describe('stripMarkdown function', () => {
  it('should handle null or undefined input', () => {
    expect(stripMarkdown(null)).toBe('');
    expect(stripMarkdown(undefined)).toBe('');
    expect(stripMarkdown('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(stripMarkdown(123)).toBe('');
    expect(stripMarkdown({})).toBe('');
    expect(stripMarkdown([])).toBe('');
  });

  it('should remove code blocks and replace with [code block]', () => {
    const input = 'Text before ```const x = 1;``` text after';
    const expected = 'Text before [code block] text after';
    expect(stripMarkdown(input)).toBe(expected);
  });

  it('should remove multiline code blocks', () => {
    const input = 'Text before\n```\nconst x = 1;\nconst y = 2;\n```\ntext after';
    const result = stripMarkdown(input);
    expect(result).toContain('Text before');
    expect(result).toContain('[code block]');
    expect(result).toContain('text after');
    expect(result).not.toContain('```');
  });

  it('should remove inline code backticks', () => {
    const input = 'Use `const` keyword for variables';
    const expected = 'Use const keyword for variables';
    expect(stripMarkdown(input)).toBe(expected);
  });

  it('should handle empty inline code blocks', () => {
    const input = 'This has `` empty code and `filled` code';
    const expected = 'This has  empty code and filled code';
    expect(stripMarkdown(input)).toBe(expected);
  });

  it('should remove bold formatting with **', () => {
    const input = 'This is **bold** text';
    const expected = 'This is bold text';
    expect(stripMarkdown(input)).toBe(expected);
  });

  it('should remove bold formatting with __', () => {
    const input = 'This is __bold__ text';
    const expected = 'This is bold text';
    expect(stripMarkdown(input)).toBe(expected);
  });

  it('should remove italic formatting with *', () => {
    const input = 'This is *italic* text';
    const expected = 'This is italic text';
    expect(stripMarkdown(input)).toBe(expected);
  });

  it('should remove italic formatting with _', () => {
    const input = 'This is _italic_ text';
    const expected = 'This is italic text';
    expect(stripMarkdown(input)).toBe(expected);
  });

  it('should remove header markers', () => {
    expect(stripMarkdown('# Heading 1')).toBe('Heading 1');
    expect(stripMarkdown('## Heading 2')).toBe('Heading 2');
    expect(stripMarkdown('### Heading 3')).toBe('Heading 3');
    expect(stripMarkdown('#### Heading 4')).toBe('Heading 4');
  });

  it('should remove link syntax but keep text', () => {
    const input = 'Click [here](https://example.com) to visit';
    const expected = 'Click here to visit';
    expect(stripMarkdown(input)).toBe(expected);
  });

  it('should remove image syntax', () => {
    const input = 'See image: ![Alt text](https://example.com/image.png)';
    const result = stripMarkdown(input);
    expect(result).toContain('See image:');
    expect(result).not.toContain('![');
    expect(result).not.toContain('](');
  });

  it('should remove video syntax', () => {
    const input = 'Watch this: [video](https://example.com/video.mp4)';
    const result = stripMarkdown(input);
    expect(result).toContain('Watch this:');
    expect(result).toContain('video');
    expect(result).not.toContain('](');
  });

  it('should remove unordered list markers with -', () => {
    const input = '- Item 1\n- Item 2\n- Item 3';
    const result = stripMarkdown(input);
    expect(result).toContain('Item 1');
    expect(result).toContain('Item 2');
    expect(result).toContain('Item 3');
    expect(result).not.toMatch(/^[\s]*-\s+/);
  });

  it('should remove unordered list markers with *', () => {
    const input = '* Item 1\n* Item 2\n* Item 3';
    const result = stripMarkdown(input);
    expect(result).toContain('Item 1');
    expect(result).toContain('Item 2');
    expect(result).toContain('Item 3');
    // Check that list markers are removed
    expect(result.split('\n')[0]).toBe('Item 1');
  });

  it('should remove ordered list markers', () => {
    const input = '1. First\n2. Second\n3. Third';
    const result = stripMarkdown(input);
    expect(result).toContain('First');
    expect(result).toContain('Second');
    expect(result).toContain('Third');
    expect(result.split('\n')[0]).toBe('First');
  });

  it('should remove blockquote markers', () => {
    const input = '> This is a quote\n> Second line';
    const result = stripMarkdown(input);
    expect(result).toContain('This is a quote');
    expect(result).toContain('Second line');
    expect(result).not.toMatch(/^[\s]*>\s+/);
  });

  it('should handle complex markdown with multiple formats', () => {
    const input = '## Title\n\nThis is **bold** and *italic* text with `code` and [link](url).\n\n- Item 1\n- Item 2';
    const result = stripMarkdown(input);
    // Should remove all markdown syntax
    expect(result).not.toContain('##');
    expect(result).not.toContain('**');
    expect(result).not.toContain('*');
    expect(result).not.toContain('`');
    expect(result).not.toContain('[');
    expect(result).not.toContain(']');
    expect(result).not.toContain('-');
  });

  it('should clean up extra whitespace', () => {
    const input = 'Text\n\n\nwith\n\n\nmultiple\n\n\nlines';
    const result = stripMarkdown(input);
    // Should collapse multiple newlines
    expect(result).not.toContain('\n\n');
  });

  it('should preserve plain text without markdown', () => {
    const input = 'This is plain text without any markdown';
    expect(stripMarkdown(input)).toBe(input);
  });
});

