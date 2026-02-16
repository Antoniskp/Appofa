const axios = require('axios');

// Constants
const MAX_REASONABLE_POPULATION = 10000000000; // 10 billion - maximum plausible population for any location
const WIKIPEDIA_API_TIMEOUT_MS = 10000; // 10 seconds timeout for Wikipedia API requests
const WIKIPEDIA_USER_AGENT = process.env.WIKIPEDIA_USER_AGENT
  || 'Appofa/1.0 (https://github.com/Antoniskp/Appofa)';

/**
 * Extract population from Wikipedia infobox wikitext
 * @param {string} wikitext - The wikitext content from Wikipedia
 * @returns {number|null} - Population number or null if not found/invalid
 */
function extractPopulation(wikitext) {
  if (!wikitext) return null;

  // Regex patterns to match various population formats in infoboxes
  const patterns = [
    /\|\s*pop_municipality\s*=\s*([^\n|]+)/i,
    /\|\s*population_municipality\s*=\s*([^\n|]+)/i,
    /\|\s*pop_municunit\s*=\s*([^\n|]+)/i,
    /\|\s*population_municunit\s*=\s*([^\n|]+)/i,
    /\|\s*pop_community\s*=\s*([^\n|]+)/i,
    /\|\s*population_community\s*=\s*([^\n|]+)/i,
    /\|\s*population[_\s]*total\s*=\s*([^\n|]+)/i,
    /\|\s*population_total\s*=\s*([^\n|]+)/i,
    /\|\s*population_estimate\s*=\s*([^\n|]+)/i,
    /\|\s*population_census\s*=\s*([^\n|]+)/i,
    /\|\s*population_urban\s*=\s*([^\n|]+)/i,
    /\|\s*population_metro\s*=\s*([^\n|]+)/i,
    /\|\s*population\s*=\s*([^\n|]+)/i,
    /\|\s*pop_total\s*=\s*([^\n|]+)/i,
    /\|\s*pop_est\s*=\s*([^\n|]+)/i,
    /\|\s*pop\s*=\s*([^\n|]+)/i,
    /\{\{pop\|([^}]+)\}\}/i
  ];

  for (const pattern of patterns) {
    const match = wikitext.match(pattern);
    if (match && match[1]) {
      const rawValue = String(match[1]).trim();

      // Reject explicit negative populations before stripping separators/markup.
      if (/^\s*-/.test(rawValue)) {
        continue;
      }

      // Clean the matched string: remove commas, periods (when used as thousands separator), spaces
      let cleanedString = rawValue
        .replace(/,/g, '')  // Remove commas
        .replace(/\./g, '')  // Remove periods (thousands separator in some locales)
        .replace(/\s/g, '')  // Remove spaces
        .replace(/\{\{[^}]+\}\}/g, '')  // Remove any remaining templates
        .replace(/\[\[[^\]]+\]\]/g, ''); // Remove any wiki links

      cleanedString = cleanedString.replace(/[^0-9]/g, '');

      if (!cleanedString) {
        continue;
      }

      const population = parseInt(cleanedString, 10);

      // Validate population is reasonable
      if (!isNaN(population) && population > 0 && population < MAX_REASONABLE_POPULATION) {
        return population;
      }
    }
  }

  return null;
}

/**
 * Fetch Wikipedia data (image and population) for a given Wikipedia URL
 * @param {string} wikipediaUrl - Full Wikipedia URL (e.g., https://en.wikipedia.org/wiki/Athens)
 * @returns {Promise<{image_url: string|null, population: number|null}>}
 */
async function fetchWikipediaData(wikipediaUrl) {
  try {
    if (!wikipediaUrl) {
      return { image_url: null, population: null };
    }

    // Parse the Wikipedia URL to extract language code and page title
    const url = new URL(wikipediaUrl);
    
    // Extract language code from hostname (e.g., 'en' from 'en.wikipedia.org')
    const hostnameParts = url.hostname.split('.');
    const langCode = hostnameParts[0];
    
    // Extract page title from path (e.g., 'Athens' from '/wiki/Athens')
    // Support trailing slashes and /w/index.php?title=... URLs.
    let pageTitle = '';
    const wikiPrefix = '/wiki/';

    if (url.pathname.startsWith(wikiPrefix)) {
      pageTitle = url.pathname.slice(wikiPrefix.length);
    } else if (url.searchParams && url.searchParams.get('title')) {
      pageTitle = url.searchParams.get('title');
    } else {
      const pathParts = url.pathname.split('/').filter(Boolean);
      pageTitle = pathParts[pathParts.length - 1] || '';
    }

    pageTitle = pageTitle.replace(/^\/+|\/+$/g, '');

    if (!langCode || !pageTitle) {
      console.error('Invalid Wikipedia URL format:', wikipediaUrl);
      return { image_url: null, population: null };
    }

    // Construct Wikipedia API URL
    const apiUrl = `https://${langCode}.wikipedia.org/w/api.php`;
    
    // Make API request
    const response = await axios.get(apiUrl, {
      params: {
        action: 'query',
        prop: 'pageimages|revisions',
        rvprop: 'content',
        rvsection: '0',
        format: 'json',
        formatversion: '2',
        pithumbsize: '500',
        origin: '*',
        titles: decodeURIComponent(pageTitle)
      },
      headers: {
        'User-Agent': WIKIPEDIA_USER_AGENT,
        'Accept': 'application/json'
      },
      timeout: WIKIPEDIA_API_TIMEOUT_MS
    });

    const pages = response.data?.query?.pages;
    if (!pages || pages.length === 0) {
      console.log('No Wikipedia page found for:', wikipediaUrl);
      return { image_url: null, population: null };
    }

    const page = pages[0];
    
    // Extract image URL
    const image_url = page.thumbnail?.source || null;
    
    // Extract population from wikitext
    const wikitext = page.revisions?.[0]?.content || '';
    const population = extractPopulation(wikitext);

    return { image_url, population };
  } catch (error) {
    console.error('Error fetching Wikipedia data:', error.message);
    // Return null values on error instead of throwing
    return { image_url: null, population: null };
  }
}

module.exports = {
  fetchWikipediaData,
  extractPopulation // Export for testing
};
