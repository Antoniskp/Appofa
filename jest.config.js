const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

// ESM-only packages that Next.js 16 / Turbopack handles natively but Jest's
// CommonJS transform pipeline cannot process without explicit transformation.
const esmPackages = [
  'react-markdown',
  'remark-gfm',
  'remark-parse',
  'remark-rehype',
  'rehype-stringify',
  'rehype-raw',
  'unified',
  'bail',
  'is-plain-obj',
  'trough',
  'vfile',
  'vfile-message',
  'unist-util-stringify-position',
  'mdast-util-from-markdown',
  'mdast-util-to-markdown',
  'mdast-util-gfm',
  'micromark',
  'micromark-extension-gfm',
  'micromark-util-combine-extensions',
  'micromark-util-chunked',
  'micromark-util-character',
  'micromark-util-encode',
  'micromark-util-html-tag-name',
  'micromark-util-normalize-identifier',
  'micromark-util-resolve-all',
  'micromark-util-sanitize-uri',
  'micromark-util-subtokenize',
  'micromark-util-symbol',
  'micromark-util-types',
  'decode-named-character-reference',
  'character-entities',
  'property-information',
  'hast-util-whitespace',
  'space-separated-tokens',
  'comma-separated-tokens',
  'date-fns',
  'next-intl',
  'use-intl',
];

const customJestConfig = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    `/node_modules/(?!(${esmPackages.join('|')})/)`,
  ],
  // Use v8 coverage provider for better performance and compatibility
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 10000,
};

module.exports = createJestConfig(customJestConfig);
