const js = require('@eslint/js');
const globals = require('globals');

const noopRule = {
  create() {
    return {};
  },
};

module.exports = [
  js.configs.recommended,
  {
    ignores: [
      '.next/**',
      'coverage/**',
      'node_modules/**',
      'uploads/**',
    ],
  },
  {
    plugins: {
      '@next/next': {
        rules: {
          'no-img-element': noopRule,
        },
      },
      'react-hooks': {
        rules: {
          'exhaustive-deps': noopRule,
        },
      },
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.jest,
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'warn',
    },
  },
  {
    files: [
      'app/**/*.js',
      'components/**/*.js',
      'hooks/**/*.js',
      'lib/**/*.js',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        ...globals.jest,
      },
    },
  },
];
