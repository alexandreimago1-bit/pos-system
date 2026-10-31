
const js = require('@eslint/js');
const globals = require('globals');
const stylistic = require('@stylistic/eslint-plugin');

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**'],
  },
  {
    files: ['**/*.js'],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: globals.node,
    },

    plugins: {
      '@stylistic': stylistic,
    },

    rules: {
      ...js.configs.recommended.rules,

      // Catch unused variables without blocking development.
      'no-unused-vars': [
        'warn',
        {
          args: 'none',
          caughtErrors: 'none',
        },
      ],

      // Code consistency.
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': [
        'error',
        'single',
        { avoidEscape: true },
      ],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/comma-dangle': [
        'error',
        'always-multiline',
      ],
      '@stylistic/object-curly-spacing': [
        'error',
        'always',
      ],
      '@stylistic/key-spacing': 'error',
      '@stylistic/space-before-blocks': 'error',
    },
  },
];
