const { extractPopulation } = require('../src/utils/wikipediaFetcher');

describe('Wikipedia Fetcher Utility', () => {
  describe('extractPopulation', () => {
    test('should extract population from population_total field', () => {
      const wikitext = `
        | population_total = 3,153,000
        | other_field = value
      `;
      const result = extractPopulation(wikitext);
      expect(result).toBe(3153000);
    });

    test('should extract population from population field', () => {
      const wikitext = `
        | population = 1,234,567
        | other_field = value
      `;
      const result = extractPopulation(wikitext);
      expect(result).toBe(1234567);
    });

    test('should extract population from pop field', () => {
      const wikitext = `
        | pop = 500,000
        | other_field = value
      `;
      const result = extractPopulation(wikitext);
      expect(result).toBe(500000);
    });

    test('should extract population from {{pop|...}} template', () => {
      const wikitext = `
        Some text {{pop|1,000,000}} more text
      `;
      const result = extractPopulation(wikitext);
      expect(result).toBe(1000000);
    });

    test('should handle population with dots as thousands separator', () => {
      const wikitext = `
        | population_total = 1.234.567
        | other_field = value
      `;
      const result = extractPopulation(wikitext);
      expect(result).toBe(1234567);
    });

    test('should handle population with spaces', () => {
      const wikitext = `
        | population_total = 1 234 567
        | other_field = value
      `;
      const result = extractPopulation(wikitext);
      expect(result).toBe(1234567);
    });

    test('should return null for invalid population', () => {
      const wikitext = `
        | population_total = invalid
        | other_field = value
      `;
      const result = extractPopulation(wikitext);
      expect(result).toBeNull();
    });

    test('should return null for unreasonably large population', () => {
      const wikitext = `
        | population_total = 99,999,999,999
        | other_field = value
      `;
      const result = extractPopulation(wikitext);
      expect(result).toBeNull();
    });

    test('should return null for negative or zero population', () => {
      const wikitext1 = `| population_total = 0`;
      const wikitext2 = `| population_total = -100`;
      
      expect(extractPopulation(wikitext1)).toBeNull();
      expect(extractPopulation(wikitext2)).toBeNull();
    });

    test('should return null for empty wikitext', () => {
      expect(extractPopulation('')).toBeNull();
      expect(extractPopulation(null)).toBeNull();
      expect(extractPopulation(undefined)).toBeNull();
    });

    test('should return null when no population field found', () => {
      const wikitext = `
        | area = 1000
        | other_field = value
      `;
      const result = extractPopulation(wikitext);
      expect(result).toBeNull();
    });

    test('should handle mixed case field names', () => {
      const wikitext = `
        | Population_Total = 500,000
        | other_field = value
      `;
      const result = extractPopulation(wikitext);
      expect(result).toBe(500000);
    });

    test('should extract first valid population when multiple patterns match', () => {
      const wikitext = `
        | population_total = 1,000,000
        | population = 2,000,000
        | pop = 3,000,000
      `;
      const result = extractPopulation(wikitext);
      expect(result).toBe(1000000); // First pattern should match
    });
  });
});
