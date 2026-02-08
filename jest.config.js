module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  // Backend Node.js code doesn't need Babel transformation
  // Node 22 already supports all the features we need
  transform: {},
  // Use v8 coverage provider for better performance and compatibility
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 10000
};
