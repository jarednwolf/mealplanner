const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      
      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      'no-undef': 'error',
      
      // React specific rules
      'react/prop-types': 'off', // TypeScript handles prop types
      'react/display-name': 'off',
      'react/jsx-uses-react': 'off', // Not needed with React 17+
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      
      // Allow certain console statements in development
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**'],
    rules: {
      // Relaxed rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
];