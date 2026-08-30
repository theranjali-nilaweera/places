import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import importX from 'eslint-plugin-import-x'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

/**
 * Architecture boundary: the logic layer (`src/services`, `src/types`) must stay
 * framework-agnostic so it can be extracted or reused server-side. It may not import
 * React or reach "up" into the UI layers.
 */
const logicLayerBoundary = {
  files: ['src/services/**/*.{ts,tsx}', 'src/types/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          { name: 'react', message: 'The logic layer must not depend on React.' },
          { name: 'react-dom', message: 'The logic layer must not depend on React.' },
        ],
        patterns: [
          {
            group: ['**/features/**', '**/components/**'],
            message: 'The logic layer must not import from the UI layers.',
          },
        ],
      },
    ],
  },
}

export default tseslint.config([
  { ignores: ['dist', 'coverage', 'node_modules', '.history'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
      reactRefresh.configs.vite,
    ],
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    settings: {
      'import-x/resolver': { typescript: true },
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      'import-x/order': [
        'warn',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  logicLayerBoundary,
  {
    files: ['**/*.{test,spec}.{ts,tsx}', 'src/test/**', 'e2e/**', 'playwright.config.ts'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'import-x/no-extraneous-dependencies': 'off' },
  },
  prettier,
])
